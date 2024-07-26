#!/usr/local/bin/perl

# Copyright 2001 by Peter Blaiklock, pblaiklo@restrictionmapper.org

# Availability & Copying:
#
# enzyme_parse3.pl is free software; you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the
# Free Software Foundation; either version 2, or (at your option) any
# later version.
#
# enzyme_parse3.pl is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# To see a copy of the GNU General Public License, see
# http://www.gnu.org/copyleft/gpl.html, or write to the
# Free Software Foundation, 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

# Overview:

# This script populates a MySQL database with restriction enzyme information from
# a REBASE file, format #19. The database is used to search DNA sequences for
# restriction endonuclease cleavage sites.

# Table columns:

# Name contains the enzyme name.

# Mainseq contains the basic recognition sequence, including any gaps and
# variable bases.

# Gapstart and gaplength contain the start position and length of the gap
# in the recognition sequence. If there is no gap both are set to zero.

# Site_length contains the length of the recognition sequence, not including the gap.
# This one of the sort criteria available to the user.

# Fivecut and threecut contain the cutpoints on the input DNA strand and the
# complementary strand respectively, relative to the first position of the
# recognition sequence.

# Fivecut2 and threecut2 contain the second set of relative cutpoints, when present.
# Otherwise they are set to -100. This accomadates enzymes that cut at 2 points
# around the recognition sequence.

# Overhang contains the type of overhang the enzyme produces, five_prime, three_prime
# or blunt. Used for sorting and filtering output.

# Prototipe indicates whether the enzyme is a prototype or an isoschizomer. Spelled
# wrong to avoid confusion with a Perl word.

# Commercial indicates whether the enzyme is sold by New England Biolabs.

# Sites contains the list of unique recognition sequences generated from mainseq.

# Requires:

# Perl DBI module, MySQL, Perl DBD driver for MySQL, Perl CGI module (optional).

# Usage:

# Get a current REBASE file, format 19, from http://rebase.neb.com/rebase/rebase.f19.html
# Remove the introductory info from the file.
# Enter the path and file name in the "my $file =" line.
# Create the table in your database with the createdb.pl script.
# Enter your database connection info (database, name, password) in the
# "$dbh = DBI->connect" line.
# Uncomment the CGI lines if you are running the script over the web.
# Make any necessary changes for your platform/OS.
# Run the script. It will take a few seconds and then print "All Done". Be sure
# to look at the database to confirm it worked.

#use warnings;
use strict;
use DBI;

# Uncomment the next three lines if you are running this over the web.
use CGI;
use CGI::Carp qw(fatalsToBrowser);
my $cgi = new CGI;

$| = 1;

my $host = `hostname`;

# Insert your connection info below.
my $dbh = DBI->connect('dbi:mysql:your_db_name:your_host', 'your_user_name', 'your_password') ||
   bail("Error", "Couldn`t open database: $DBI::errstr on $host");

my $sth_enzyme = $dbh->prepare("INSERT enzyme_complete2
                                (
                                 name,
                                 mainseq,
                                 gapstart,
                                 gaplength,
                                 site_length,
                                 fivecut,
                                 threecut,
                                 fivecut2,
                                 threecut2,
                                 overhang,
                                 prototipe,
                                 commercial,
                                 sites
                                )
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
|| bail("Error", "Couldn't edit enzyme_table2 : $DBI::errstr\n");

# Insert your own path below.
my $file = "/path/to/enzyme/file.txt";
open FILE, $file or bail("Error", "Couldn't open file");
$/ = "//\n\n";

my @sitelist;
my $previous = "q";
my $update = $dbh->prepare("UPDATE enzyme_complete2
                            SET fivecut2 = ?,
                                threecut2 = ?
                            WHERE name = ?") || bail("Error", "Couldn't prepare update");

while (<FILE>) {
   my @list = split /\n/;

   #Skips noncommercials
   next if ($list[6] eq "CR   .");

   #Gets enzyme name, skips if it is a homing endonuclease.
   my $name = substr($list[0], 5, (length($list[0]) - 5));
   next if (substr($name, 0, 2) eq "I-");


   #Skips methylases
   next if (substr($name, 0, 2) eq "M.");

   my $fivecut2 = -100;
   my $threecut2 = -100;

   # Double cutting enzymes are each listed twice in the file. If the current name is the
   # same as the previous name, the cutpoints are placed in the previous entry.
   if ($name eq $previous) {
      my @seqs = split /;/, $list[5];
      # Removes line header.
      $seqs[0] = substr($seqs[0], 5, (length($seqs[0]) - 5));

      # Splits element into sequence and cutpoint, assigns each to
      # a variable.
      my @seq1 = split /, /, $seqs[0];
      my $mainseq = $seq1[0];
      $threecut2 = ($seq1[1]);
      $threecut2 = (-1 * $threecut2) + (length($mainseq));
      my @seq2 = split /, /, $seqs[1];
      $fivecut2 = ($seq2[1]);
#      $name = $dbh->quote($name);
#      $threecut2 = $dbh->quote($threecut2);
      $update->execute($fivecut2, $threecut2, $name);
      next;
   }

   # @seqs holds the recognition sequences and 5' strand cutpoints
   # for the enzyme. If the cut points are asymmetrical, there will
   # be 2 elements in this array, otherwise only one.
   my @seqs = split /;/, $list[5];
   # Removes line header.
   $seqs[0] = substr($seqs[0], 5, (length($seqs[0]) - 5));

   # Splits element into sequence and cutpoint, assigns each to
   # a variable.
   my @seq1 = split /, /, $seqs[0];
   my $mainseq = $seq1[0];
   my $fivecut = $seq1[1];
   next if $fivecut eq "?";

   # These are declared outside the if block.
   my @seq2;
   my $threecut;

   # If cuts are asymmetrical, the 3' strand cutpoint is read
   # from @seq2. Otherwise, it is computed from the
   # 5' cutpoint.
   if (scalar @seqs == 2) {
      @seq2 = split /, /, $seqs[1];
      $threecut = (-1 * $seq2[1]) + (length($mainseq));
   }
   else {
      $threecut = (length($mainseq)) - $fivecut;
   }

   # Determines gap length and start point from the Ns in the recognition sequence.
   my $gap_length;
   my $sequence = $mainseq;
   my $gap_start = index($mainseq, "N");
   if ($gap_start != -1) {
      $sequence =~ s/N//g;
      $gap_length = length($mainseq) - length($sequence);
   }
   else {
      ($gap_length, $gap_start) = (0, 0);
   }

   # The commercial list in the file will have an N if the enzyme is sold by NEB.
   my $commercial = "all";
   $commercial = "NEBall" if ($list[6] =~ /N/);

   # Determines overhang from the relative positions of fivecut and threecut.
   my $overhang;
   if ($threecut > $fivecut) {
      $overhang = "five_prime";
   }
   elsif ($threecut < $fivecut) {
      $overhang = "three_prime";
   }
   else {
      $overhang = "blunt";
   }

   # If the prototype name equals the enzyme name, the enzyme is a prototype.
   my $prototipe = "all";
   $prototipe = "yesall" if (substr($list[4], 5, (length($list[4]) - 5)) eq $name);

   # Generates the list of recognition sequences from basic sequence, puts it in @sitelist.
   @sitelist = ();
   tree ($sequence, 0);

   # Since the search script handles reverse complements, they are eliminated here.
   if (scalar @sitelist > 1) {
      foreach my $i (1..$#sitelist) {
         if ($sitelist[$i - 1] eq revcomp($sitelist[$i])) {
            @sitelist = array_excise($i, 1, @sitelist);
         }
      }
   }
   my $listsites = join(" ", @sitelist);
   $sth_enzyme->execute($name, $mainseq, $gap_start, $gap_length,
                length($sequence), $fivecut, $threecut, $fivecut2, $threecut2,
                $overhang, $prototipe, $commercial, $listsites)
                || bail("Error", "Couldn't execute insertion: $DBI::errstr\n");


   $previous = $name;
}
$sth_enzyme->finish();

$dbh->disconnect || die "Couldn't disconnect\n";
bail("Success", "It worked");

# Recursive subroutine generates all sequences of $site starting at $i.
sub tree {
   my ($site, $i) = (shift, shift);

   # Hash of variable bases and their possibilities.
   my %abbreviations = (
                R => "AG",
                Y => "CT",
                M => "AC",
                K => "GT",
                S => "GC",
                W => "AT",
                B => "CGT",
                D => "AGT",
                H => "ACT",
                V => "ACG",
   );

   my $piece = substr($site, 0, $i);
   my $fragment;
   my @bases;

   while ($i < length($site)) {
      my $base = substr($site, $i, 1);
      if ($base !~/[ACGT]/) {
         @bases = split //, $abbreviations{$base};
         foreach (@bases) {
            $fragment = $piece . $_ . substr($site, length($piece) + 1, length($site) - length($piece));
            tree($fragment, length($piece));
         }
      last;
      }
      else {
         $piece .= $base;
      }
      $i++;
   }
   if (length($piece) == length($site)) {
         push @sitelist, $piece;
   }
}

# Returns the reverse complement of a DNA sequence.
sub revcomp {
   my $strand = shift;
   $strand =~ tr/ACGT/TGCA/;
   $strand = reverse($strand);
   return $strand;
}

# Removes internal elements of an array
sub array_excise {
   my ($start, $length, @subject) = (shift, shift, @_);
   return @subject[$length..$#subject] if ($start == 0);
   return @subject[0..$start - 1] if (($start + $length) >= $#subject);
   my @front = @subject[0..$start - 1];
   my @back = @subject[$start + $length..$#subject];
   push @front, @back;
   return @front;
}

# Exits with specified title and message to the browser.
sub bail {
   my ($title, $message) = (shift, shift);
   print $cgi->header(-type => "text/html", -target => "_blank");
   print $cgi->start_html(-type => 'text/html', -title => $title);
   print $cgi->h3($title), $cgi->p(), $message;
   print $cgi->end_html();
   exit;
}
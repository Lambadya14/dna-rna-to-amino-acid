#!/usr/local/bin/perl

# Copyright 2001 by Peter Blaiklock, pblaiklo@restrictionmapper.org

# Availability & Copying:
#
# sitefind3.pl is free software; you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the
# Free Software Foundation; either version 2, or (at your option) any
# later version.
#
# sitefind3.pl is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# To see a copy of the GNU General Public License, see
# http://www.gnu.org/copyleft/gpl.html, or write to the
# Free Software Foundation, 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

# Overview:
#
# sitefind3.pl searches DNA sequences for restriction endonuclease cleavage sites
# and displays the results in an HTML table, using parameters specified by the user
# in an HTML form. It can also perform a virtual digestion, returning a table of
# expected fragments. The enzyme information used for the search is stored in a MySQL
# database table.

# Usage:
#
# Create and populate the enzyme table with createdb.pl and enzyme_parse3.pl.
# Set up the HTML form, available at www.restrictionmapper.org.

# Features:
#
# Supports linear or circular DNA.
# Reports actual cutpoints, as opposed to the 1st base of the recognition sequence.
# Multiple options for sorting and filtering the output.
# Virtual digestion with user selected enzymes.

# Requires: Perl DBI module, Perl CGI module, MySQL, Perl DBD driver for MySQL.

use strict;
use DBI;
use CGI;

$CGI::POST_MAX = 3145716;

my $cgi = new CGI;

$| = 1;

# $input holds the DNA sequence, $startlength the original sequence length.
my ($input, $startlength) = seq_check();

# Holds individually selected enzymes, if any.
my @enzymelist = $cgi->param('enzymelist');
if ($enzymelist[0] eq "All Enzymes") {shift @enzymelist};

# Determines maximum number of cuts per enzyme that will be reported.
my $maxcuts;
if ($cgi->param('maxcuts') eq "all") {
   $maxcuts = 1000000;
}
else {$maxcuts = $cgi->param('maxcuts')};

# Connects to enzyme database
my $dbh = DBI->connect('insert your connection info') ||
   bail("Error", "Couldn`t open database: $DBI::errstr");

# Creates unique name for temporary table. Not necessary in latest version of MySQL.
my $connectid = $dbh->{'thread_id'};
my $tempname = "temp" . $connectid;

# Holds the selection from the enzyme table
my ($rows, $minlength, @overhang)  = db_select();
my @search;

my ($tempname2, $update, $cutinfo, $enzinfo, @deletelist, $text, $morecutinfo);
my ($enz5_1, $pos5_1, $seq5_1, $enz5_2, $pos5_2, $seq5_2, %forward, %reverse);
my ($gaplength1, $sitelength1, $fivecut1, $fivecut21, $sumlength1, $dna);
my ($gaplength2, $sitelength2, $fivecut2, $fivecut22, $sumlength2, $limit);

if ($cgi->param('digest')) {digest($rows)};

# Creates temporary table to hold info on found sites.
my $table = $dbh->do
   ("CREATE TABLE $tempname (
      name       VARCHAR(10) NOT NULL PRIMARY KEY,
      mainseq    VARCHAR(20) NOT NULL,
      site_length TINYINT UNSIGNED NOT NULL,
      overhang   VARCHAR(12) NOT NULL,
      commercial VARCHAR(30) NOT NULL,
      cutlist    TEXT NOT NULL,
      frequency  SMALLINT UNSIGNED NOT NULL)")
   || bail("Error", "Couldn`t create temporary table : $DBI::errstr");


# Prepares insertion of found enzyme info into temporary table.
my $populate = $dbh->prepare
   ("INSERT $tempname(
      name,
      mainseq,
      site_length,
      overhang,
      commercial,
      cutlist,
      frequency)
   VALUES
      (?,?,?,?,?,?,?)")
   || bail("Error", "Couldn`t select search list: $DBI::errstr");

# Holds names of enzymes that don't cut sequence.
my @noncutters;

$rows->execute() || bail("Error", "Couldn`t execute selection : $DBI::errstr");

# Loop searches sequence one enzyme at a time for digestion sites.
while (@search = $rows->fetchrow_array()) {

   my @totalcuts = get_sites();
   my $cutnumber = scalar(@totalcuts);

   # If the enzyme cuts, the enzyme info is put into the table, as long as it
   # doesn't cut too often.
   if ($cutnumber > 0) {
      if ($cutnumber <= $maxcuts) {
         my $cutlist = join ", ", (sort {$a <=> $b} @totalcuts);
         $populate->execute(@search[0, 1, 4, 9, 10], $cutlist, $cutnumber);
      }
      else {next};
   }
   # The enzyme name goes on the noncutters list if the enzyme doesn't cut.
   else {push @noncutters, $search[0]};

}

$rows->finish();
$populate->finish();

print $cgi->header(-type => "text/html", -target => "_blank");
print $cgi->start_html(-type => 'text/html', -title => 'RestrictionMapper Output');

# Prints all user specified criteria
print $cgi->p(), $cgi->b("Name: "), $cgi->param('seqname');
print $cgi->p(), $cgi->b("Conformation: "), $cgi->param('DNAtype');

if ($enzymelist[0]) {
    print $cgi->p(), $cgi->b("Enzymes: "), (join ", ", @enzymelist);
}
else {
   print $cgi->p(), $cgi->b("Overhang: "), (join ", ", @overhang);
   print $cgi->p(), $cgi->b("Minimum Site Length: "), $minlength . " bases";
   print $cgi->p(), $cgi->b("Maximum Number of Cuts: ");

   if ($maxcuts == 1000000) {
       print "all";
   }
   elsif ($maxcuts == 0) {
      print "noncutters only";
   }
   else {print $maxcuts};

   my @includelist;
   if ($cgi->param('enzymetype') eq "NEB") {
      push @includelist, "NEB only";
   }
   else {push @includelist, "all commercial"};

   if ($cgi->param('isoschizomers') eq "all") {
      push @includelist, "all isoschizomers";
   }
   else {push @includelist, "prototypes only"};

   print $cgi->p(), $cgi->b("Included: "), (join ", ", @includelist);
}
print $cgi->p(), $cgi->b("Noncutters: "), (join ", ", @noncutters);
print $cgi->p();

# Selects all data from temporary table, sorted by user's parameters, and prints
# it out in a HTML table.
if ($maxcuts > 0) {
   my $count = $dbh->do("SELECT COUNT(*) FROM $tempname");
   if ($count > 0) {
      my $sort_by = join(", ",($cgi->param('first'), $cgi->param('second'), $cgi->param('third')));
      my $printout = $dbh->prepare("SELECT name, mainseq, site_length, overhang,
                                           cutlist, frequency
                                    FROM $tempname
                                    ORDER BY $sort_by");

      $printout->execute();

      print "<TABLE cellspacing = \"2\" border = \"2\" cellpadding = \"3\">
                <THEAD align = \"center\">
                   <TR>
                      <TH>Name
                      <TH>Sequence
                      <TH>Site Length
                      <TH>Overhang
                      <TH>Frequency
                      <TH>Cut Positions

                <TBODY align = \"center\">";

      while (my @output = $printout->fetchrow_array()) {
         my $reblink = "http://rebase.neb.com/rebase/enz/".$output[0].'.html';
         my $namelink = shift @output;

         print "<TR align = \"center\" >
          <TD><A href = $reblink> $namelink </A>
          <TD>$output[0]
          <TD>$output[1]
          <TD>$output[2]
          <TD>$output[4]
          <TD>$output[3]";
      }
      print "</TABLE>";
      $printout->finish();
   }
   else {print $cgi->p(), $cgi->b("No digestion sites match your selection.")};
}

print $cgi->end_html();
my $drop = $dbh->do("DROP TABLE $tempname");
$dbh->disconnect() || die "Couldn`t disconnect\n";

sub get_sites{

   # @totalcuts holds found cut positions for all recognition sites of the enzyme.
   my @totalcuts;
   my $gaplength = $search[3];

   # Creates list of all possible recognition sites for the enzyme.
   my @sitelist = split / /, $search[11];

   # Loop searches DNA for each recognition site.
   foreach (@sitelist) {

      # Gets list of positions for the site.
      my @cuts = sitefind($input, @search[2,3,5,6,7,8], $_);

      # Gets list of positions for complement of site, if site not palindromic.
      my @compcuts;
      if ($_ ne revcomp($_)) {

         my @compsearch = @search;

         # Switches 5', 3' cut offsets.
         ($compsearch[5], $compsearch[6]) = ($compsearch[6], $compsearch[5]);
         ($compsearch[7], $compsearch[8]) = ($compsearch[8], $compsearch[7]);

         @compcuts = sitefind(revcomp($input), @compsearch[2,3,5,6,7,8], $_);

         foreach my $cut (@compcuts){
            $cut = length($input) - $cut;
         }

         # Combines all positions into one list.
         push @cuts, @compcuts;
      }
OUTER:foreach my $j (@cuts) {

             # Adjusts positions of cutpoints in circular DNA to account for
             # extensions.
             if ($cgi->param('DNAtype') eq "circular") {
                  if ($j < 15) {
                     $j = $startlength - 15 + $j;
                  }
                  elsif ($j > $startlength + 15) {
                     $j = $j - ($startlength + 15);
                  }
                  else {$j -= 15};
             }

         # Skips if position already on list to avoid duplicates.
         foreach my $k (@totalcuts) {
            next OUTER if ($j == $k or $j == 0);
         }
         push @totalcuts, $j;
      }
   }
   return @totalcuts;
}

# Accepts info about the recognition site to be searched for and returns a list
# of cut positions for that site.
sub sitefind {
    my ($input, $gapstart, $gaplength, $fivecut, $threecut, $fivecut2, $threecut2, $site) = @_;
    my @seq_list;
    my $start = 0;

       # Gets the sequence of site preceding the gap (if any).
       my $front = substr($site, 0, $gapstart);

       #Gets sequence of site following the gap, which is entire site if no gap.
       my $back = substr($site, $gapstart, length($site) - $gapstart);

       while (index($input, $back, $start) != -1) {
          my $flag = 0;

          # Finds back part of site, goes to begining and looks for front part.
          # If front part also found, sets flag.
          my $found = index($input, $back, $start);
          my $jump = $found - length($front) - $gaplength;
          if ( !($front) or index($input, $front, $jump) == $jump ) {
             $flag = 1;

             # If any cut position on either strand is off the end of a linear molecule,
             # the flag is unset.
             if ($cgi->param('DNAtype') eq "linear") {
                if ($fivecut2 != -100) {
                   if (($fivecut2 + $jump) >= length($input) or ($threecut2 + $jump) >= length($input)
                      or ($fivecut2 + $jump) < 0 or ($threecut2 + $jump) < 0) {
                      $flag = 0;
                   }
                }
                if (($fivecut + $jump) >= length($input) or ($threecut + $jump) >= length($input)
                   or ($fivecut + $jump) < 0 or ($threecut + $jump) < 0) {
                   $flag = 0;
                }
             }
             # Puts input strand cut position(s) on return list if flag is set.
             if ($flag) {
                push @seq_list, $jump + $fivecut;
                if ($fivecut2 != -100) {
                   push @seq_list, $jump + $fivecut2;
                }
             }
          }
          $start = $found + 1;
       }
    return @seq_list;
}

sub seq_check {

   my ($input, $startlength);

   if ($cgi->param('sequence')) {
      # Checks for illegal characters.
      if ($cgi->param('sequence') =~ /[^acgt\s\d]/i ) {
         bail("Error", "Invalid sequence. Sequence can have only bases, numbers and spaces.");
      }
      $input = $cgi->param('sequence');
   }
   else {bail("Error", "No sequence entered. Go back and paste in a sequence.")};

   # Converts to upper case and removes numbers and spaces.
   $input = uc($input);
   $input =~ s/\s+|\d+//g;

   # Longest current recognition sequence is 15. Minimum DNA length set at 16 bases.
   $startlength = length($input);
   if ($startlength < 16) {bail("Error", "Sequence Too Short")};

   # Extensions added to simulate circular DNA. This allows sequences that span
   # the start/end junction to be recognized.
   if ($cgi->param('DNAtype') eq "circular") {
      my $head = substr($input, 0, 15);
      my $tail = substr($input, $startlength - 15, 15);
      $input = $tail . $input. $head;
   }
   return ($input, $startlength);
}

sub db_select{

   my ($rows, $minlength, @overhang);

   # Selects from the enzyme table according to the user's criteria.
   if ($enzymelist[0]) {
      my $listzyme = join "' OR name='", @enzymelist;
      $rows = $dbh->prepare
         ("SELECT name, mainseq, gapstart, gaplength,
               site_length, fivecut, threecut,
               fivecut2, threecut2, overhang, commercial, sites
           FROM enzyme_complete2
           WHERE name = '$listzyme'")
         || die "Couldn`t prepare enzymelist: $DBI::errstr";
   }
   else {
      my $hangover;

      # Determines whether all commercial enzymes are selected or only New England
      # Biolabs enzymes.
      my $commercial = $cgi->param('enzymetype');
      $commercial = "%".$commercial."%";

      # Minimum length of the recognition site
      $minlength = $cgi->param('minlength');

      # Determines whether all isoschizomers are selected or only prototypes.
      my $isoschizomers = $cgi->param('isoschizomers');
      $isoschizomers = "%".$isoschizomers."%";

      # Selects user specified overhangs.
      @overhang = $cgi->param('overhang');
      if ($overhang[0]) {
         $hangover = join "' OR overhang='", @overhang;
      }
      else {bail("Error", "You must specify at least one overhang.")};

      $rows = $dbh->prepare
         ("SELECT name, mainseq, gapstart, gaplength,
               site_length, fivecut, threecut,
               fivecut2, threecut2, overhang, commercial, sites
        FROM enzyme_complete2
        WHERE commercial LIKE '$commercial'
        AND (overhang = '$hangover')
        AND site_length >= $minlength
        AND prototipe LIKE '$isoschizomers'")
      || die "Couldn`t prepare selection: $DBI::errstr";

   }
   return ($rows, $minlength, @overhang);
}

sub digest {

# Enzymes must be selected from the list. Exits with error message
# if no enzymes are selected
   if (!$enzymelist[0]) {
      bail("Error", "Please select some enzymes to digest with.");
   }

# Gets selection from enzyme table from main program
   my $rows2 = shift;

# Removes attached oligos from circular DNA
   if ($cgi->param('DNAtype') eq "circular") {
      $dna = substr($input, 15, length($input) - 30);
   }
   else {
      $dna = $input;
   }

# Creates temporary table to hold digestion products. For each fragment the
# 5' enzyme, 3' enzyme, 5' position, 3' position, length and sequence are stored.
   my $temptable = $dbh->do
      ("CREATE TABLE $tempname (
         id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         length MEDIUMINT UNSIGNED NOT NULL,
         5enz VARCHAR(10) NOT NULL,
         5pos MEDIUMINT UNSIGNED NOT NULL,
         3enz VARCHAR(10) NOT NULL,
         3pos MEDIUMINT UNSIGNED NOT NULL,
         sequence MEDIUMTEXT NOT NULL)")
      || die "Couldn`t create table : $DBI::errstr\n";

   my $populate = $dbh->prepare
      ("INSERT $tempname(
         length,
         5enz,
         5pos,
         3enz,
         3pos,
         sequence)
      VALUES
         (?,?,?,?,?,?)")
      || die "Couldn`t select search list: $DBI::errstr";

# Selects each enzyme in users list from table
   $rows2->execute() || die "Couldn`t execute selection : $DBI::errstr\n";
   my $count = 0;
   $limit = 0;

# Finds every digestion site for each enzyme on the list and stores them in the
# temporary table. $count keeps track of the number of cut sites.

   while (@search = $rows2->fetchrow_array()) {
      foreach my $i (get_sites()) {
         $populate->execute(0, $search[0], $i + 1, "none", 0, "z");
         $count += 1;
      }
   }

   $rows2->finish();

# Adds first fragment to table if molecule is linear. This is necessary because
# there is no cut site corresponding with the begining of the molecule.
   if ($cgi->param('DNAtype') eq "linear") {
      $populate->execute(0, "none", 1, "none", 0, "z");
      $count += 1;
      $limit = 1;
   }

   if ($count == $limit) {bail("No Cut Sites", "The selected enzymes do not digest the sequence")};

   $populate->finish();

# A second temporary table is created. Fragments from the first temporary table are
# sorted by 5' cut position and inserted in the second temporary table. This allows
# the fragment IDs to be in sequential order.
   $tempname2 = $tempname . "z";

   my $temptable2 = $dbh->do
      ("CREATE TABLE $tempname2 (
         id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         length MEDIUMINT UNSIGNED NOT NULL,
         5enz VARCHAR(10) NOT NULL,
         5pos MEDIUMINT UNSIGNED NOT NULL,
         3enz VARCHAR(10) NOT NULL,
         3pos MEDIUMINT UNSIGNED NOT NULL,
         sequence MEDIUMTEXT NOT NULL)")
      || die "Couldn`t create ordered table: $DBI::errstr\n";

   my $sort2 = $dbh->prepare
      ("SELECT length, 5enz, 5pos, 3enz, 3pos, sequence FROM $tempname
        ORDER BY 5pos")
      || die "Couldn`t prepare selection from unordered table: $DBI::errstr\n";

   $sort2->execute() || die "Couldn`t execute selection from ordered table: $DBI::errstr\n";

   my $populate2 = $dbh->prepare("INSERT $tempname2
                                         (length, 5enz, 5pos, 3enz, 3pos, sequence)
                                  VALUES (?,      ?,    ?,    ?,    ?,    ?)")
                   || die "Couldn`t prepare insertion into ordered table: $DBI::errstr\n";

   while (my @insert = $sort2->fetchrow_array) {
      $populate2->execute(@insert) || die "Couldn`t execute insertion into ordered table: $DBI::errstr\n";
   }

   $populate2->finish() || die "Couldn`t finish insertion into ordered table: $DBI::errstr\n";
   $sort2->finish() || die "Couldn`t finish selection from unordered table: $DBI::errstr\n";

   my $drop = $dbh->do("DROP TABLE $tempname");

   $update = $dbh->prepare("UPDATE $tempname2
                            SET length = ?, 3enz = ?, 3pos = ?, sequence = ?
                            WHERE id = ?");

   my $fill_in = $dbh->prepare("SELECT * FROM $tempname2")
      || die "Couldn`t select from ordered table: $DBI::errstr\n";

   $fill_in->execute() || bail("Error", "Couldn`t execute fill_in");;

# Loops through fragments filling in 3' position, 3' enzyme, length and sequence.
# 3' enzyme and position is the same as the 5' enzyme and position of the following
# fragment. Sequence is the substring of the starting molecule from 5' position
# to 3' position. $firstenz and $firstpos will be needed by the circ function.

   my (@first, @second);

   @first = $fill_in->fetchrow_array();
   my $firstenz = $first[2];
   my $firstpos = $first[3];

   while (@second = $fill_in->fetchrow_array()) {

      $first[5] = $second[3] - 1;
      $first[4] = $second[2];
      $first[6] = getseq($first[3], $first[5]);
      $first[1] = length($first[6]);
      $text .= "first = " . join(", ", @first) . "<P>";
      $update->execute(@first[1,4..6], $first[0]);
      @first = @second;

   }

# circ fills in info on last fragment (linear DNA) or attaches last fragment to
# first fragment (circular DNA).
   circ($firstpos, $firstenz, $dna, @first);

# Fixconflict resolves situations in which one digestion site interferes with another.
   fixconflict($count);


   my $printout = "<B> Enzymes:</B> " . join(", ", @enzymelist) . " <P>\n"
                  . "<TABLE align = \"left\" cellpadding = \"6\"><TR>\n
                                <TD><B> Length </B>\n
                                <TD><B> 5' Enzyme </B>\n
                                <TD><B> 5' Base </B>\n
                                <TD><B> 3' Enzyme </B>\n
                                <TD><B> 3' Base </B>\n
                                <TD><B> Sequence </B>";

   my $getable = $dbh->prepare("SELECT * FROM $tempname2 ORDER BY length DESC");
   $getable->execute();

   my @show;
   while (@show = $getable->fetchrow_array()) {
      shift @show;
      $show[5] = dnaformat($show[5]);
      $printout .= "\n<TR align = \"center\" valign = \"top\">";
      $printout .= "\n<TD>" . join("\n<TD>", @show[0..4]) . "\n<TD align = \"left\"> $show[5]";
   }
   $printout .= "\n</TABLE>";

   $update->finish();
   $fill_in->finish();
   $getable->finish;

   my $drop2 = $dbh->do("DROP TABLE $tempname2");

   $dbh->disconnect() || die "Couldn`t disconnect\n";

   bail($cgi->param('seqname') . " digest", $printout);
}

# Conflicts in which digestion at one site eliminates another site produce fragments
# with nonsequential ends. Fixconflict finds these conflicts, generates the
# resulting fragments and adds them to the table.
sub fixconflict {

   $cutinfo = $dbh->prepare("SELECT 5enz, 5pos, sequence FROM $tempname2 WHERE id = ?")
              || die "Couldn`t prepare cut info selection from ordered table: $DBI::errstr\n";

   $morecutinfo = $dbh->prepare("SELECT 3enz, 3pos, sequence FROM $tempname2 WHERE id = ?")
                  || die "Couldn`t prepare cut info selection from ordered table: $DBI::errstr\n";

   $enzinfo = $dbh->prepare("SELECT gaplength, site_length, fivecut, fivecut2
                             FROM enzyme_complete2
                             WHERE name = ?")
              || die "Couldn`t prepare enzyme info selection from enzyme table: $DBI::errstr\n";

   my $fragdelete = $dbh->prepare("DELETE FROM $tempname2 WHERE id = ?")
                    || die "Couldn`t prepare deletion: $DBI::errstr\n";

   my $fraginsert = $dbh->prepare("INSERT $tempname2
                                          (length, 5enz, 5pos, 3enz, 3pos, sequence)
                                   VALUES (?,      ?,    ?,    ?,    ?,    ?)")
                    || die "Couldn`t prepare insertion into ordered table: $DBI::errstr\n";

   my $exist = $dbh->prepare("SELECT id FROM $tempname2
                              WHERE 5enz = ? AND 5pos = ?
                              AND 3enz = ? AND 3pos = ?")
               || die "Couldn`t prepare existence check: $DBI::errstr";

# $count holds starting number of fragments in table.
   my $count = shift;

   my $i = 1;
   my $j;

   $cgi->param('DNAtype') eq "linear" ? ($limit = $count - 1) : ($limit = $count);

   my $fraglen;

# Loops through fragments and tests for conflicts between adjacent cut sites e.g. 2 and 3. If
# a conflict is found, tests for conflicts between nonadjacent sites, e.g. 1 and 3 and 2 and 4.
# Keeps going till no conflict found, repeats for each adjacent pair.

   while ($i <= $limit) {

      $j = $i + 1;
      $j -= $limit if ($j > $limit and $cgi->param('DNAtype') eq "circular");

# Conflictlevel returns degree of conflict between 2 sites. 1 = no conflict.
      my $level = conflictlevel($i, $j);
      if ($level > 1) {

# $outerflag is a binary flag that holds the conflict state
# of the current adjacent pair.
         my $outerflag = 1;

# $jump determines id of the next cut to test for conflict
         my $jump = 1;

# Fragadjust specifies fragments to be added or deleted based on conflict level
# The hashes %forward and %reverse hold the info for fragments to be added.
# @deletelist holds the IDs of fragments to be deleted.

         fragadjust($level, $i, $j, $count);
      }

      $i++;

# Adds contents of %forward, %reverse to table if same fragment not already there.
      if ($forward{pos5_1}) {

# Checks for existence in the table.
         $exist->execute(@forward{'enz5_1', 'pos5_1', 'enz3_1', 'pos3_1'})
         || bail("Error", $DBI::errstr);

         my @forcheck = $exist->fetchrow_array();

         if (!$forcheck[0]) {

# Gets sequence and length from $dna.
            my $forseq = getseq($forward{pos5_1}, $forward{pos3_1});
            $fraglen = length($forseq);

            $fraginsert->execute($fraglen, @forward{'enz5_1', 'pos5_1', 'enz3_1', 'pos3_1'}, $forseq);
         }
      }
      if ($reverse{pos5_1}) {

         $exist->execute(@reverse{'enz5_1', 'pos5_1', 'enz3_1', 'pos3_1'})
         || bail("Error", $DBI::errstr);

         my @revcheck = $exist->fetchrow_array();

         if (!$revcheck[0]) {

            my $revseq = getseq($reverse{pos5_1}, $reverse{pos3_1});
            $fraglen = length($revseq);

            $fraginsert->execute($fraglen, @reverse{'enz5_1', 'pos5_1', 'enz3_1', 'pos3_1'}, $revseq);
         }
      }
   }

# Deletes all fragments on @deletelist.
   foreach my $k (@deletelist) {
      if (!$fragdelete->execute($k)) {$text .= "Couldn`t delete $k: $DBI::errstr <P>"};
   }

   $cutinfo->finish();
   $enzinfo->finish();
   $morecutinfo->finish();
   $fraginsert->finish();
   $fragdelete->finish();
   $exist->finish();
   return;
}

sub getseq {

   my ($frontend, $backend) = @_;
   $frontend -= 1;
   if ($backend > $frontend) {
      return substr($dna, $frontend, $backend - $frontend);
   }
   else {
      my $seq = substr($dna, $frontend, length($dna) - $frontend);
      $seq .= substr($dna, 0, $backend);
      return $seq;
   }
}

# Fragadjust specifies fragments to add and marks fragments for deletion based on
# the type of conflict between two sites.

sub fragadjust {

# $first and $second hold the IDs of the 2 cuts being compared. $level holds the
# conflict level of $first and $second (reported by conflictlevel function).
# $count holds the original number of cuts (before adjustment for conflicts).
   my ($level, $first, $second, $count) = @_;

# $firstend and $secondend hold the IDs of the ends of the potential fragment to
# be added to the table.
   my ($firstend, $secondend);

#Resets the hashes that hold fragments to be added to the table
   %forward = ();
   %reverse = ();

# @forwardarray and @reversearray hold the ids of the cuts to be checked for conflict
# with $second in the reverse direction and with $first in the forward direction, respectively.
   my @forwardarray = ($second..$count);
   my @reversearray = reverse(1..$second - 1);

# Adds IDs of cuts beyond the junction to @forwardarray and @reversearray for
# circular DNA. Also sets $firstend to the last cut ID if $first is the first cut ID.
   if ($cgi->param('DNAtype') eq "circular") {

      push @reversearray, reverse($second + 1..$count);
      push @forwardarray, (1..$first - 1);

      if ($first == 1) {$firstend = $count};
   }

# For when $second eliminates $first.
   if (($level == 2 or $level == 8) and ($first > 1)) {

      $firstend = $first - 1;

# Goes through @reversearray, i.e. backwards cut by cut, until it finds a cut
# that doesn't eliminate $second. The ID of the cut previous to this goes into $firstend.
      foreach my $i (@reversearray) {
         my $testlevel = conflictlevel($i, $second);
         if ($testlevel == 2 or $testlevel == 8) {
            $firstend = $i - 1;
         }
         else {
            last;
         }
      }

# Gets the enzyme and position of each end of the new fragment.
      $cutinfo->execute($firstend) || bail("Error", "Couldn`t get reverse firstend info: $DBI::errstr");
      ($reverse{enz5_1}, $reverse{pos5_1}) = $cutinfo->fetchrow_array();

      $cutinfo->execute($second) || bail ("Error", "Couldn`t get reverse secondend info: $DBI::errstr");
      ($reverse{enz3_1}, $reverse{pos3_1}) = $cutinfo->fetchrow_array();
      $reverse{pos3_1} -= 1;
   }

# For when $first eliminates $second.
   if ($level == 4 or $level == 8) {
      $secondend = $second + 1;

# Goes through @forwardarray, i.e. forward cut by cut, until it finds a cut
# that doesn't eliminate $first. The ID of this cut goes in $secondend.
      foreach (@forwardarray) {

         my $testlevel = conflictlevel($first, $_);
         if ($testlevel == 4 or $testlevel == 8) {
            $secondend = $_;
         }
         else {
            last;
         }
      }

# Gets the enzyme and position of each end of the new fragment.
      $cutinfo->execute($first) || bail("Error", "Couldn`t get forward firstend info: $DBI::errstr");
      ($forward{enz5_1}, $forward{pos5_1}) = $cutinfo->fetchrow_array();

      $morecutinfo->execute($secondend) || bail("Error", "Couldn`t get forward secondend info: $DBI::errstr");
      ($forward{enz3_1}, $forward{pos3_1}) = $morecutinfo->fetchrow_array();
   }

# For when $first and $second eliminate each other. In this case the connecting
# fragment will never appear and its ID ($first) is put on the delete list if not
# already there.
   if ($level == 8) {
      my $skip = 0;
      foreach my $j (@deletelist) {
         if ($first == $j) {
            $skip = 1;
            last;
         }
      }
      push @deletelist, $first if (!$skip);
   }

   return;
}

# Returns the degree of conflict between 2 cut sites. 1 is no conflict, 2 means
# the second site destroys the first site, 4 means the 1st site destroys the 2nd
# site and 8 is mutual conflict. Also sets global variables holding information
# about current cuts and enzymes being tested for conflict.
sub conflictlevel {

# The IDs of the two sites being tested.
   my ($frontid, $backid) = @_;

# $flag will hold cumulative conflict level.
   my $flag = 0;

# $check will hold current conflict level.
   my $check = 0;

# Quick check for obvious nonstarters.
   return 1 if (($frontid < 1) or ($backid < 1));
   return 1 if ($frontid == $backid);
   return 1 if ($backid > $limit + 1);

# Gets 5' cut info for 1st fragment.
   $cutinfo->execute($frontid) || die "Couldn`t get cut info: $DBI::errstr";
   ($enz5_1, $pos5_1) = $cutinfo->fetchrow_array();

# No conflict if first "cut" is only the end of a linear molecule.
   return 1 if ($enz5_1 eq "none");

# Gets remaining site and enzyme info for both positions.
   $enzinfo->execute($enz5_1) || die "Couldn`t get enzyme info: $DBI::errstr";

   ($gaplength1, $sitelength1, $fivecut1, $fivecut21) = $enzinfo->fetchrow_array();

   $sumlength1 = $gaplength1 + $sitelength1;

   $cutinfo->execute($backid) || bail("Error", "Couldn`t get backid info: $DBI::errstr");
   ($enz5_2, $pos5_2) = $cutinfo->fetchrow_array();

# Same as for $enz5_1, above.
   return 1 if ($enz5_2 eq "none");

   $enzinfo->execute($enz5_2) || bail("Error", "Couldn`t get enz5_2 info: $DBI::errstr");
   ($gaplength2, $sitelength2, $fivecut2, $fivecut22) = $enzinfo->fetchrow_array();
   $sumlength2 = $gaplength2 + $sitelength2;

# Sees if second cut eliminates the first cut.
   $check = testconflict($enz5_1, $pos5_1, $enz5_2, $pos5_2, $sumlength1, $fivecut1, $fivecut21);

   if ($check) {
      $flag += $check;
   }
# If the second cut is from a dual cutter, sees if the other cut of the second
# cut eliminates the first cut.
   elsif ($fivecut22 != -100) {

# Gets the id of other cut.
      my $otherend = findend($enz5_2, $pos5_2, $fivecut2, $fivecut22);
      $cutinfo->execute($otherend) || bail("Error", "Couldn`t get otherend info: $DBI::errstr");

# Gets the info for the other cut.
      my %othercut;
      ($othercut{enz}, $othercut{pos}) = $cutinfo->fetchrow_array;
# Checks for conflict.
      $flag += testconflict($enz5_1, $pos5_1, $othercut{enz}, $othercut{pos}, $sumlength1, $fivecut1, $fivecut21);
   }

# Sees if first cut eliminates the second one.
   $check = testconflict($enz5_2, $pos5_2, $enz5_1, $pos5_1, $sumlength2, $fivecut2, $fivecut22) * 2;

   if ($check) {
      $flag += $check;
   }

# Sees if other end of first cut eliminates the second cut, as above.
   elsif ($fivecut21 != -100) {

      my $otherend = findend($enz5_1, $pos5_1, $fivecut1, $fivecut21);
      $cutinfo->execute($otherend) || bail("Error", "Couldn`t get otherend info: $DBI::errstr");

      my %othercut;
      ($othercut{enz}, $othercut{pos}) = $cutinfo->fetchrow_array;
      $flag += testconflict($enz5_2, $pos5_2, $othercut{enz}, $othercut{pos}, $sumlength2, $fivecut2, $fivecut22) * 2;
   }

# Power of two not really necessary, but whatever.
   return (2 ** $flag);
}

# Finds the id of the other cut of a dual cut enzyme, given the position of the
# known cut and the enzyme info.
sub findend {

# $enzyme holds the name of the enzyme, $position holds the known cut position.
# $firstcut and $secondcut hold the RELATIVE positions of the cutpoints to the
# first base of the recognition site.

   my ($enzyme, $position, $firstcut, $secondcut) = @_;
   my @idarray;

   my $getid = $dbh->prepare("SELECT id FROM $tempname2
                              WHERE 5enz = ? AND 5pos = ?")
                            || bail ("Error", "Unable to prepare ID selection: $DBI::errstr");

# Leap is the distance from the known position to look for the new position. $secondcut
# is subtracted because it is always negative.
   my $leap = $firstcut - $secondcut;

   my $firstend = 0;
   my $secondend = 0;

# $newpos holds the position at which to check for the other cut.
   my $newpos = $position + $leap;

# Adjusts $newpos for circular DNA if necessary.
   if ($newpos > length($dna) and $cgi->param('DNAtype') eq "circular") {$newpos -= length($dna)};

# Looks to see if there is a cut from the correct enzyme at $newpos and puts the new
# cut id in $firstend if found.
   $getid->execute($enzyme, $newpos);
   @idarray = $getid->fetchrow_array();
   if ($idarray[0]) {
      $firstend = $idarray[0];
   }

# Repeats the above procedure in the other direction.
   $newpos = $position - $leap;

   if ($newpos < 1 and $cgi->param('DNAtype') eq "circular") {
      $newpos += length($dna);
   }

   $getid->execute($enzyme, $newpos);
   @idarray = $getid->fetchrow_array();
   if ($idarray[0]) {
      $secondend = $idarray[0];
   }

   $getid->finish();

# If a cut from $enzyme is found $newpos bases away from $position in EACH direction
# resolvend determines which cut is correct.
   if ($firstend and $secondend) {
      my $truepos = resolvend($position, $enzyme, $firstcut, $secondcut);
      if (!$truepos) {bail("Error", "Unable to find other end of $enzyme cut at $position")};
      if ($truepos == $firstcut) {return $secondend};
      return $firstend;
   }
   elsif ($firstend) {
      return $firstend;
   }
   return $secondend;
}

# If findend finds cuts at the proper distance from $position in both directions
# resolvend looks for the recognition sequence to determine which one is correct.
sub resolvend {

# Same as in findend.
   my ($position, $enzyme, $firstcut, $secondcut) = @_;

# Gets recognition site info from database.
   my $morenzinfo = $dbh->prepare("SELECT gapstart, gaplength, site_length, sites
                                   FROM enzyme_complete2
                                   WHERE name = ?") || bail("Error", $DBI::errstr);

# $front and $back hold sections of the recognition site on each side of the gap.
   my ($front, $back);

   $morenzinfo->execute($enzyme) || bail("Error", $DBI::errstr);

# $gapstart holds the start position of the gap relative to the 1st base of the
# recognition sequence, $gaplength holds the length of the gap, $sitelength holds
# the length of the site NOT including the gap and $sites holds the space delimited
# list of recognition sites.
   my ($gapstart, $gaplength, $sitelength, $sites) = $morenzinfo->fetchrow_array;

   my @sites = split / /, $sites;

   $morenzinfo->finish();

# Looks $firstcut bases backward and $secondcut bases forward from $position.
   foreach my $hop ($firstcut, $secondcut) {
      my $start = $position - $hop;

# For each recognition site, determines $front and $back and looks for $front at
# the expected position. If $front is found, jumps the gap and looks for $back. If
# $back is found it's done and returns either $firstcut or $secondcut to findend.
      foreach my $i (@sites) {
         $front = substr($i, 0, $gapstart);
         $back =  substr($i, $gapstart, length($i) - $gapstart);

         if (substr($dna, $start, length($front)) == $front) {
            if (substr($dna, $start + length($front) + $gaplength, length($back)) == $back) {
               return $hop;
            }
         }
      }
   }
# Shouldn't ever happen.
   return 0;
}

# Determines if one site eliminates with another
sub testconflict {

# The enzyme names and cut positions of the 2 sites being tested. The function
# determines if $pos5_2 falls within the critical zone of $enz5_1, thereby
# destroying it.
   my ($enz5_1, $pos5_1, $enz5_2, $pos5_2, $sumlength, $fivecut, $fivecut2) = @_;

   # 0 means no conflict. Returns 0 if positions are too far apart to conflict.
   return 0 if abs($pos5_2 - $pos5_1) > 34;

# Returns 0 if either "site" is merely an end of the molecule.
   return 0 if ($enz5_1 eq "none" or $enz5_2 eq "none");

# $begin and $end mark the boundaries of the critical zone for the site being
# tested for interference.
   my ($begin, $end);

# Sets $begin and $end for dual cut enzymes. $begin is the 5' cutpoint, $end is the 3' cutpoint.
   if ($fivecut2 != -100) {
      $begin = $pos5_1;
      my $endid = findend($enz5_1, $pos5_1, $fivecut, $fivecut2);
      $cutinfo->execute($endid);
      my @endarray = $cutinfo->fetchrow_array();
      $end = $endarray[1];
   }
# Sets $begin and $end for regular enzymes. $begin is the first base of the recognition
# sequence and $end is either the cut point or the last base of the sequence, whichever
# comes last.
   else {
      $begin = $pos5_1 - $fivecut;
      $sumlength > $fivecut ? ($end = $begin + $sumlength) : ($end = $begin + $fivecut);
   }
   if ($begin > $end) {($begin, $end) = ($end, $begin)};

# Returns 1 if the cutpoint of the second enzyme falls within the critical
# zone of the first enzyme.
   ($pos5_2 > $begin and $pos5_2 < $end) ? return 1 : return 0
}

sub circ {

# This function updates the info for the last fragment. If the input DNA is
# circular the first fragment's sequence is attached to the last fragment and the 3'
# enzyme and position of the first fragment become those of the last fragment.
# For linear DNA the 3' enzyme is "none" and the 3' position is the last base.

# $firstpos and $firstenz are the 5' position and 5' enzyme of the 1st fragment
# in the table. @first holds the (incomplete) info for the final fragment.

   my ($firstpos, $firstenz, $dna, @first) = @_;

   my ($finlength, $finseq, $name, $finpos);

# Gets the sequence and length of the last fragment
   $finseq = substr($dna, $first[3] - 1, length($dna) - $first[3] + 1);
   $finlength = length($dna) - $first[3];

   if ($cgi->param('DNAtype') eq "linear") {
      $finpos = length($dna);
      $name = "none";
   }
   else {
      $finpos = $firstpos - 1;
      $finlength += $finpos;
      $finseq .= substr($dna, 0, $finpos);
      $name = $firstenz;
   }
# Updates final fragment.
   $update->execute($finlength, $name, $finpos, $finseq, $first[0])
   || die "Couldn`t add final fragment: $DBI::errstr\n";

   return;
}

# Formats sequence into lines of 5 chunks. Each chunk has 10 bases. Chunks are
# separated by spaces.
sub dnaformat {

   my $sequence = shift;
   my ($newseq, $i);

   for ($i = 0; $i < length($sequence); $i += 10) {
       $newseq .= substr($sequence, $i, 10) . " ";
   }

   $sequence = ();
   for ($i = 0; $i < length($newseq); $i += 55) {
      $sequence .= substr($newseq, $i, 55) . " <P>";
   }
   return $sequence;
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

# Returns the reverse complement of a DNA sequence.
sub revcomp {
   my $strand = shift;
   $strand =~ tr/ACGT/TGCA/;
   $strand = reverse($strand);
   return $strand;
}

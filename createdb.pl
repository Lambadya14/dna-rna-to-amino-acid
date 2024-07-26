#!c:/perl/bin

# Copyright 2001 by Peter Blaiklock, pblaiklo@apexmail.com

# Availability & Copying:
#
# createdb.pl is free software; you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the
# Free Software Foundation; either version 2, or (at your option) any
# later version.
#
# createdb.pl is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# To see a copy of the GNU General Public License, see
# http://www.ling.nwu.edu/~sburke/gnu_release.html, or write to the
# Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.

# Overview:
#
# Creates a table to hold restriction enzyme data for searching DNA sequences.
# A full description of the table is in the enzyme_parse-v2-1.pl documentation.

# Requires: Perl DBI module, MySQL, Perl DBD driver for MySQL.

# Usage:
#
# Make any necessary changes for your platform/OS.
# Insert your connection parameters in the "$dbh = DBI->connect" line before
# running the script.

use warnings;
use strict;
use DBI;

my $dbh = DBI->connect('insert your connection info') ||
   die "Couldn't open database: $DBI::errstr\n";

my $main_table = $dbh->do
   ("CREATE TABLE enzyme_complete2 (
      name       VARCHAR(10) NOT NULL PRIMARY KEY,
      mainseq    VARCHAR(20) NOT NULL,
      gapstart   TINYINT UNSIGNED NOT NULL,
      gaplength  TINYINT UNSIGNED NOT NULL,
      site_length TINYINT UNSIGNED NOT NULL,
      fivecut    TINYINT NOT NULL,
      threecut   TINYINT NOT NULL,
      fivecut2   TINYINT NOT NULL,
      threecut2  TINYINT NOT NULL,
      overhang   VARCHAR(12) NOT NULL,
      commercial VARCHAR(7) NOT NULL,
      prototipe  VARCHAR(7) NOT NULL,
      sites      VARCHAR(75) NOT NULL)")
   || die "Couldn't create table : $DBI::errstr\n";

$dbh->disconnect || die "Couldn't disconnect\n";
print "Database closed\n";

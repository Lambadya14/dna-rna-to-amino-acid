"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

interface TableDetailsProps {
  querySequence: string;
}

const TableDetails: React.FC<TableDetailsProps> = ({ querySequence }) => {
  const [blastResult, setBlastResult] = useState<any | null>(null);

  useEffect(() => {
    const database = "nt";
    const program = "blastn&MEGABLAST=on";
    const codon = querySequence;

    const params = `CMD=Put&PROGRAM=${program}&DATABASE=${database}&QUERY=${codon}`;

    axios
      .post("https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then((response) => {
        const data = response.data;
        const ridMatch = data.match(/^    RID = (.*$)/m);
        const rtoeMatch = data.match(/^    RTOE = (.*$)/m);

        const rid = ridMatch ? ridMatch[1] : null;
        const rtoe = rtoeMatch ? parseInt(rtoeMatch[1]) : null;

        if (!rid || !rtoe) {
          console.error("Failed to retrieve RID or RTOE from response.");
          return;
        }

        setTimeout(pollResults, rtoe * 1000, rid);
      })
      .catch((error) => {
        console.error("Error submitting BLAST request:", error);
      });

    function pollResults(rid: string) {
      const pollInterval = 5000; // 5 seconds

      const pollTimer = setInterval(() => {
        axios
          .get(
            `https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${rid}`
          )
          .then((response) => {
            const data = response.data;
            if (data.match(/\s+Status=WAITING/m)) {
              // Still waiting, continue polling
              return;
            } else if (data.match(/\s+Status=FAILED/m)) {
              console.error(
                `Search ${rid} failed; please report to blast-help@ncbi.nlm.nih.gov.`
              );
              clearInterval(pollTimer);
              return;
            } else if (data.match(/\s+Status=UNKNOWN/m)) {
              console.error(`Search ${rid} expired.`);
              clearInterval(pollTimer);
              return;
            } else if (data.match(/\s+Status=READY/m)) {
              if (data.match(/\s+ThereAreHits=yes/m)) {
                clearInterval(pollTimer);
                retrieveResults(rid);
              } else {
                console.error("No hits found.");
                clearInterval(pollTimer);
              }
            } else {
              console.error("Unexpected status received.");
              clearInterval(pollTimer);
            }
          })
          .catch((error) => {
            console.error("Error polling for results:", error);
            clearInterval(pollTimer);
          });
      }, pollInterval);
    }

    function retrieveResults(rid: string) {
      axios
        .get(
          `https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&FORMAT_TYPE=JSON2_S&RID=${rid}`
        )
        .then((response) => {
          const data = response.data.BlastOutput2[0].report.results.search;
          if (data) {
            setBlastResult(data);
          }
        })
        .catch((error) => {
          console.error("Error retrieving results:", error);
        });
    }
  }, [querySequence]); // Empty dependency array to ensure useEffect runs only once

  function calculateMetrics(hit: any) {
    let maxScore = 0;
    let totalScore = 0;
    let queryCover = 0;
    let eValue = 0;

    if (hit.hsps && hit.hsps.length > 0) {
      // Menghitung max score
      maxScore = hit.hsps[0].bit_score || 0;

      // Menghitung total score
      totalScore = hit.hsps.reduce(
        (acc: number, hsp: any) => acc + (hsp.bit_score || 0),
        0
      );

      // Menghitung query cover
      const queryLength = querySequence.length;
      const alignmentLength = hit.hsps[0].align_len || 0;
      queryCover = (alignmentLength / queryLength) * 100;

      // Mengambil E value dari HSP pertama
      eValue = hit.hsps[0].evalue || 0;
    }

    return { maxScore, totalScore, queryCover, eValue };
  }
  function capitalizeEachWord(str: string) {
    return str.replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }
  return (
    <div className="relative overflow-x-auto px-5 pb-5">
      {blastResult && (
        <table className="w-full text-sm text-left rtl:text-right bg-[#8884d8] rounded-xl">
          <thead className="text-xs text-white  uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">
                Scientific Name
              </th>
              <th scope="col" className="px-6 py-3">
                Accession
              </th>

              <th scope="col" className="px-6 py-3">
                Percent Identity (%)
              </th>

              <th scope="col" className="px-6 py-3">
                Max Score
              </th>
              <th scope="col" className="px-6 py-3">
                Total Score
              </th>
              <th scope="col" className="px-6 py-3">
                Query Cover
              </th>
              <th scope="col" className="px-6 py-3">
                E. Value
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {blastResult &&
              blastResult.hits.map((hit: any) => {
                const { maxScore, totalScore, queryCover, eValue } =
                  calculateMetrics(hit);

                return (
                  <tr key={hit.num} className="bg-white border-b ">
                    <td className="px-6 py-4">
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/search/all/?term=${hit.description[0].taxid}`}
                      >
                        {capitalizeEachWord(hit.description[0].sciname)}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/search/all/?term=${hit.description[0].accession}`}
                      >
                        {hit.description[0].accession}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {(
                        (hit.hsps[0].identity / hit.hsps[0].align_len) *
                        100
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-6 py-4">{Math.floor(maxScore)}</td>
                    <td className="px-6 py-4">{Math.floor(totalScore)}</td>
                    <td className="px-6 py-4">{Math.floor(queryCover)}%</td>
                    <td className="px-6 py-4">{eValue}</td>
                    <td className="px-6 py-4">{hit.description[0].title}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TableDetails;

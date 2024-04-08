"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

interface TableDetailsProps {
  querySequence: string;
}

const TableDetails: React.FC<TableDetailsProps> = ({ querySequence }) => {
  const [blastResult, setBlastResult] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const maxPagesToShow: number = 5;

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
      const pollInterval = 5000;

      const pollTimer = setInterval(() => {
        axios
          .get(
            `https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${rid}`
          )
          .then((response) => {
            const data = response.data;
            if (data.match(/\s+Status=WAITING/m)) {
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
  }, [querySequence]);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const renderPerPageOptions = () => {
    const options = [5, 10, 25, 50, blastResult?.hits.length || 1];

    return (
      <select
        value={itemsPerPage}
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        className="mx-1 px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === blastResult?.hits.length ? "All" : option}
          </option>
        ))}
      </select>
    );
  };

  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const currentItems = blastResult
    ? blastResult.hits.slice(firstIndex, lastIndex)
    : [];

  const totalPages = Math.ceil(blastResult?.hits.length / itemsPerPage);

  const renderPageNumbers = () => {
    if (itemsPerPage === blastResult?.hits.length) {
      return null; // Jika memilih "All", tombol navigasi tidak ditampilkan
    }

    const pagesToShow = Math.min(totalPages, maxPagesToShow);

    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);
    const firstPage = Math.max(1, currentPage - halfMaxPagesToShow);
    const lastPage = Math.min(totalPages, firstPage + maxPagesToShow - 1);

    const pages: JSX.Element[] = [];

    for (let i = firstPage; i <= lastPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`mx-1 px-3 py-1 border border-gray-300 ${
            currentPage === i
              ? "bg-gray-300 text-gray-700"
              : "bg-white text-gray-500"
          } rounded`}
        >
          {i}
        </button>
      );
    }

    if (firstPage > 2) {
      pages.unshift(
        <span key="ellipsis-1" className="mx-1 text-gray-500">
          ...
        </span>
      );
    }

    if (firstPage > 1) {
      pages.unshift(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={`mx-1 px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded`}
        >
          1
        </button>
      );
    }

    if (lastPage < totalPages) {
      if (lastPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-2" className="mx-1 text-gray-500">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`mx-1 px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded`}
        >
          {totalPages}
        </button>
      );
    }

    return <div className="flex justify-center mt-4">{pages}</div>;
  };

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
    <div className="relative overflow-x-auto pt-5 pb-5">
      {blastResult && (
        <>
          {" "}
          <h2 className="font-bold text-[30px]">Table Identifikasi</h2>
          <div className="flex justify-start items-center my-2">
            <span className="mr-2">Show per page:</span>
            {renderPerPageOptions()}
          </div>
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
              {currentItems.map((hit: any) => {
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
          <div className="flex justify-center mt-4">{renderPageNumbers()}</div>
        </>
      )}
    </div>
  );
};

export default TableDetails;

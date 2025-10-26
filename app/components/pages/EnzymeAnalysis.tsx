"use client";

import { useEffect, useState } from "react";
import {
  parseEnzymeData,
  analyzeRestriction,
} from "../../utils/restrictionAnalysis";

interface DnaSequenceProps {
  querySequence: string;
}

const EnzymeAnalysis: React.FC<DnaSequenceProps> = ({ querySequence }) => {
  const [enzymeData, setEnzymeData] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/enzyme");
        const data = await response.json();
        setEnzymeData(data.enzymeData);
      } catch (error) {
        console.error("Error fetching enzyme data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (enzymeData) {
      const enzymes = parseEnzymeData(enzymeData);
      const results = analyzeRestriction(querySequence, enzymes);
      setAnalysisResults(results);
    }
  }, [enzymeData]);

  return (
    <div>
      <h1>Restriction Analysis</h1>

      <table className="w-full text-center">
        <thead className="border-b-2">
          <tr>
            <th>Name</th>
            <th>Sequence</th>
            <th>Site Length</th>
            <th>Overhang</th>
            <th>Frequency</th>
            <th>Cut Positions</th>
          </tr>
        </thead>
        <tbody>
          {analysisResults.map((result, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}>
              <td>{result.name}</td>
              <td>{result.sequence}</td>
              <td>{result.siteLength}</td>
              <td>{result.overhang}</td>
              <td>{result.frequency}</td>
              <td>{result.cutPositions.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnzymeAnalysis;

import { db } from "@/app/lib/firebase/init";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";

interface DnaSequenceProps {
  querySequence: string;
}

const EnzymeAnalysis: React.FC<DnaSequenceProps> = ({ querySequence }) => {
  const [enzymes, setEnzymes] = useState<any[]>([]);
  const [result, setResult] = useState<any[]>([]);

  useEffect(() => {
    // Mengambil data enzim dari Firebase
    const fetchEnzymes = async () => {
      const enzymeCollection = collection(db, "allEnzymeTypes");
      const enzymeSnapshot = await getDocs(enzymeCollection);
      const enzymeList = enzymeSnapshot.docs.map((doc) => doc.data());
      setEnzymes(enzymeList);
    };

    fetchEnzymes();
  }, []);

  const toRegexPattern = (sequence: string): string => {
    const replacements: { [key: string]: string } = {
      A: "A",
      C: "C",
      G: "G",
      T: "T",
      R: "[AG]",
      Y: "[CT]",
      M: "[AC]",
      K: "[GT]",
      S: "[GC]",
      W: "[AT]",
      H: "[ACT]",
      B: "[CGT]",
      D: "[AGT]",
      N: "[ACGT]",
    };
    return sequence.replace(
      /A|C|G|T|[RYMKSWHDN]/g,
      (match) => replacements[match] || match
    );
  };

  const analyzeRestriction = (dna: string, enzymes: any[]) => {
    const result: any = {};
    for (const enzyme of enzymes) {
      const pattern5 = toRegexPattern(enzyme.sequence5.replace("/", ""));
      const pattern3 = toRegexPattern(enzyme.sequence3.replace("/", ""));
      const matches5 = Array.from(dna.matchAll(new RegExp(pattern5, "g")));
      const matches3 = Array.from(dna.matchAll(new RegExp(pattern3, "g")));

      if (matches5.length > 0 || matches3.length > 0) {
        if (!result[enzyme.name]) {
          result[enzyme.name] = {
            Enzim: enzyme.name,
            sequence5: enzyme.sequence5,
            sequence3: enzyme.sequence3,
            Overhang: enzyme.overhang,
            Positions5: [],
            Positions3: [],
            Frequency5: 0,
            Frequency3: 0,
          };
        }

        matches5.forEach((match) => {
          const cutPosition =
            (match.index || 0) + enzyme.sequence5.indexOf("/");
          result[enzyme.name].Positions5.push(cutPosition);
          result[enzyme.name].Frequency5++;
        });

        matches3.forEach((match) => {
          const cutPosition =
            (match.index || 0) + enzyme.sequence3.indexOf("/");
          result[enzyme.name].Positions3.push(cutPosition);
          result[enzyme.name].Frequency3++;
        });
      }
    }
    return Object.values(result);
  };

  useEffect(() => {
    if (querySequence) {
      const analysisResult = analyzeRestriction(querySequence, enzymes);
      setResult(analysisResult);
    }
  }, [querySequence, enzymes]); // Run analysis when querySequence or enzymes change

  return (
    <div>
      <h2 className="font-bold text-[30px]">Restriksi Enzim</h2>

      {result.length > 0 ? (
        <table className="w-full text-left">
          <thead className="border-b-2">
            <tr>
              <th>No</th>
              <th>Enzim</th>
              <th>Sequence Cut (5&apos; & 3&apos;)</th>
              <th>Positions</th>
              <th>Frequency</th>
              <th className="text-center">Overhang</th>
            </tr>
          </thead>
          <tbody>
            {result.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}>
                <td>{index + 1}</td>
                <td>{item.Enzim}</td>
                <td>
                  5'-{item.sequence5}-'3 <br />
                  3'-{item.sequence3}-'5
                </td>

                <td>
                  5&apos; = {item.Positions5.join(", ")} <br /> 3&apos; ={" "}
                  {item.Positions3.join(", ")}
                </td>

                <td>
                  5&apos; = {item.Frequency5} <br /> 3&apos; = {item.Frequency3}
                </td>

                <td className="text-center">{item.Overhang}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data available or still loading...</p>
      )}
    </div>
  );
};

export default EnzymeAnalysis;

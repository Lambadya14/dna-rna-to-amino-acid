import React from "react";

interface DataDisplayComponentProps {
  data: any[];
  handleEdit: (id: string) => void;
  handleDeleteConfirmation: (id: string) => void;
}

const DataDisplayComponent: React.FC<DataDisplayComponentProps> = ({
  data,
  handleEdit,
  handleDeleteConfirmation,
}) => {
  return (
    <div className="p-5">
      <table className="w-full text-center">
        {" "}
        <thead className="border-b-2">
          <tr>
            <th>Nama Option Group</th>
            <th>DNA</th>
            <th>RNA</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}>
              <td className=" p-3 ">{item.nama}</td>
              <td className=" p-3 ">{item.abbr1}</td>
              <td className=" p-3 ">{item.abbr3}</td>
              <td className=" p-3 ">{item.dna.join(", ")}</td>
              <td className=" p-3 ">{item.rna.join(", ")}</td>
              <td className="border-s border-e px-4 py-2 group">
                <div className="overflow-hidden line-clamp-3 group-hover:line-clamp-none text-justify">
                  {item.abt}
                </div>
              </td>

              <td className=" p-3 flex-col">
                <button onClick={() => handleEdit(item.id)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25px"
                    height="25px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#2483cc"
                      d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"
                    />
                    <path
                      fill="#2483cc"
                      d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2z"
                    />
                  </svg>
                </button>
                {/* Tombol delete */}
                <button onClick={() => handleDeleteConfirmation(item.id)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25px"
                    height="25px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#cc0606"
                      d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataDisplayComponent;

import React from "react";

interface FormComponentProps {
  formValues: any;
  dynamicDNAInputs: string[];
  dynamicRNAInputs: string[];
  handleFormSubmit: (e: React.FormEvent) => Promise<void>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleDynamicDNAInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddDynamicDNAInput: () => void;
  handleRemoveDynamicDNAInput: (index: number) => void;
  handleDynamicRNAInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddDynamicRNAInput: () => void;
  handleRemoveDynamicRNAInput: (index: number) => void;
  isEditMode: boolean;
  isLoading: boolean;
  handleCancel: () => void;
  handleFileSubmit: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChargeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePolarityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  charge: string;
  polarity: string;
}

const FormComponent: React.FC<FormComponentProps> = ({
  formValues,
  dynamicDNAInputs,
  dynamicRNAInputs,
  handleFormSubmit,
  handleInputChange,
  handleDynamicDNAInputChange,
  handleAddDynamicDNAInput,
  handleRemoveDynamicDNAInput,
  handleDynamicRNAInputChange,
  handleAddDynamicRNAInput,
  handleRemoveDynamicRNAInput,
  isEditMode,
  handleCancel,
  handleFileSubmit,
  isLoading,
  handleChargeChange,
  charge,
  handlePolarityChange,
  polarity,
}) => {
  return (
    <form className="flex flex-col px-5" onSubmit={handleFormSubmit}>
      <div className="flex justify-between">
        <div className="w-1/2 flex flex-col me-3 font-semibold">
          <label id="htmlNama" htmlFor="nama">
            Nama Asam Amino
          </label>
          <input
            className="border p-3 -2 rounded-lg mb-3"
            type="text"
            id="nama"
            value={formValues.nama}
            onChange={handleInputChange}
            name="nama"
          />
          <label htmlFor="abbr1">Singkatan 1</label>
          <input
            className="border p-3 -2 rounded-lg  mb-3"
            type="text"
            id="abbr1"
            maxLength={1}
            value={formValues.abbr1}
            pattern="[A-Za-z]+"
            onChange={handleInputChange}
          />
          <label htmlFor="abbr3">Singkatan 3</label>
          <input
            className="border p-3 -2 rounded-lg  mb-3"
            type="text"
            id="abbr3"
            maxLength={3}
            value={formValues.abbr3}
            onChange={handleInputChange}
          />
          <label htmlFor="dna">DNA (A, C, T, dan G)</label>
          {dynamicDNAInputs.map((input, index) => (
            <div key={index} className="relative flex">
              <input
                className="border p-3 -2 rounded-lg w-full "
                type="text"
                id={index.toString()}
                value={input}
                maxLength={3}
                onChange={handleDynamicDNAInputChange}
              />
              {index === dynamicDNAInputs.length - 1 && (
                <button
                  type="button"
                  onClick={handleAddDynamicDNAInput}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-[30px]"
                >
                  +
                </button>
              )}
              {dynamicDNAInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDynamicDNAInput(index)}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 text-[30px]"
                >
                  -
                </button>
              )}
            </div>
          ))}

          <label htmlFor="rna" className="mt-3">
            RNA (A, C, U, dan G)
          </label>
          {dynamicRNAInputs.map((input, index) => (
            <div key={index} className="relative flex">
              <input
                className="border p-3 -2 rounded-lg w-full"
                type="text"
                id={index.toString()}
                value={input}
                maxLength={3}
                onChange={handleDynamicRNAInputChange}
              />
              {index === dynamicRNAInputs.length - 1 && (
                <button
                  type="button"
                  onClick={handleAddDynamicRNAInput}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-[30px]"
                >
                  +
                </button>
              )}
              {dynamicRNAInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDynamicRNAInput(index)}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 text-[30px]"
                >
                  -
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="w-1/2 flex flex-col">
          <label htmlFor="abt">About</label>
          <textarea
            className="border p-3 -2 rounded-lg h-full"
            id="abt"
            value={formValues.abt}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="my-5 ">
        <label htmlFor="inputGambar">
          <p className="font-bold">Pilih Gambar:</p>
          <input
            formEncType="multipart/form-data"
            type="file"
            id="inputFile"
            onChange={handleFileSubmit}
          />
        </label>
      </div>
      <div>
        <p className="font-bold">Pilih Group:</p>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="charge"
            name="charge"
            value="Acidic"
            checked={charge === "Acidic"}
            onChange={handleChargeChange}
          />
          Acidic
        </label>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="charge"
            name="charge"
            value="Basic"
            checked={charge === "Basic"}
            onChange={handleChargeChange}
          />
          Basic
        </label>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="charge"
            name="charge"
            value="Neutral"
            checked={charge === "Neutral"}
            onChange={handleChargeChange}
          />
          Neutral
        </label>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="charge"
            name="charge"
            value="Aliphatic"
            checked={charge === "Aliphatic"}
            onChange={handleChargeChange}
          />
          Aliphatic
        </label>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="charge"
            name="charge"
            value="Aromatic"
            checked={charge === "Aromatic"}
            onChange={handleChargeChange}
          />
          Aromatic
        </label>
      </div>
      <div>
        <p className="font-bold">Polaritas:</p>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="polarity"
            name="polarity"
            value="Polar"
            checked={polarity === "Polar"}
            onChange={handlePolarityChange}
          />
          Polar
        </label>
        <label className="ms-3 flex">
          <input
            type="radio"
            id="polarity"
            name="polarity"
            value="Nonpolar"
            checked={polarity === "Nonpolar"}
            onChange={handlePolarityChange}
          />
          Nonpolar
        </label>
      </div>
      <div className="flex justify-center">
        {isEditMode && (
          <button
            className="rounded-md h-[40px] w-full me-3 my-3 bg-[#d9534f] text-white"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
        <button
          id="submit-button"
          className="rounded-md h-[40px] w-full my-3 bg-[#098c28] text-white"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-dasharray="15"
                  stroke-dashoffset="15"
                  stroke-linecap="round"
                  stroke-width="2"
                  d="M12 3C16.9706 3 21 7.02944 21 12"
                >
                  <animate
                    fill="freeze"
                    attributeName="stroke-dashoffset"
                    dur="0.3s"
                    values="15;0"
                  />
                  <animateTransform
                    attributeName="transform"
                    dur="1.5s"
                    repeatCount="indefinite"
                    type="rotate"
                    values="0 12 12;360 12 12"
                  />
                </path>
              </svg>
              <p>Loading...</p>
            </div>
          ) : isEditMode ? (
            "Update"
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </form>
  );
};

export default FormComponent;

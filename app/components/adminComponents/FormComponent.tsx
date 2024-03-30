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
  handleCancel: () => void;
  handleFileSubmit: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
}) => {
  return (
    <form className="flex flex-col px-5" onSubmit={handleFormSubmit}>
      <div className="flex justify-between">
        <div className="w-1/2 flex flex-col me-3 font-semibold">
          <label htmlFor="nama">Nama Asam Amino</label>
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
      <div>
        <input formEncType="multipart/form-data" type="file" onChange={handleFileSubmit} />
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
        >
          {isEditMode ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default FormComponent;

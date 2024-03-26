// Layout.tsx
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { push } = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/user/checkUser");

      if (response.status === 200) {
        // User is authenticated
        console.log("User is authenticated.");
      } else {
        // If the server returns a status other than 200, redirect to login
        console.log("User is not authenticated. Redirecting to login.");
        push("/auth/login");
      }
    } catch (error) {
      // Handle Axios errors, including 401 Unauthorized
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("Unauthorized. Redirecting to login.");
        push("/auth/login");
      } else {
        // Handle other errors
        console.error("Error fetching user data:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const result = await fetch("/api/user/logOut", {
        method: "GET",
      });

      if (result.status === 200) {
        // After successful logout, redirect to login
        push("/auth/login");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      // Handle error logging out, e.g., display an error message
    }
  };

  return (
    <div>
      <nav className="flex justify-between p-5 bg-[#c4d884] mb-3">
        <h1 className="font-bold text-[30px] text-center text-[#212121]">
          Dashboard Admin
        </h1>
        <button
          onClick={handleLogout}
          className="bg-[#ef2a2a] text-white w-[100px] rounded-lg"
        >
          Sign Out
        </button>
      </nav>
      {children}
    </div>
  );
};

export default Layout;

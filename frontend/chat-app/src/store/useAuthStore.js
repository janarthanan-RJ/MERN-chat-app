import {create} from "zustand"
import { axiosInstance } from "../lib/axios.js"
import toast from "react-hot-toast"
import {io} from "socket.io-client"

const BASE_URL=import.meta.env.MODE==="development" ? "http://localhost:5001":"/"


export const useAuthStore =create((set,get)=>({
    authUser:null,
    isSigningUp:false,
    isLoggingIng:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket:null,

checkAuth: async () => {
        try {
          const token = localStorage.getItem("token"); // Declare token outside the if block
      
          if (!token) {
            // No token, user is not authenticated
            set({ authUser: null, isCheckingAuth: false });
            return;
          }
      
          const res = await axiosInstance.get("/auth/check", {
            headers: {
              Authorization: `Bearer ${token}`, // Now token is always defined
            },
          });
      
          set({ authUser: res.data });
          get().connectSocket()
        } catch (error) {
          console.log("Error in checkAuth:", error);
          set({ authUser: null });
          localStorage.removeItem("token"); // remove invalid token from localstorage
        } finally {
          set({ isCheckingAuth: false });
        }
      },


signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/signup", data)
          console.log("Signup response:", res.data)
          set({ authUser: res.data.user })
          localStorage.setItem("token", res.data.token)
          toast.success("Account created successfully")
          get().connectSocket()
        } catch (error) {
            console.error("Signup error:", error);
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message)
          } else {
            toast.error("An unexpected error occurred.")
            console.error("Signup error:", error)
          }
        } finally {
          set({ isSigningUp: false })
        }
      },
 

login: async (data) =>{
  set({isLoggingIng: true})
  try {
    const res =await axiosInstance.post("/auth/login",data)
    console.log("axiosInstance.post response:", res.data)
    set({authUser: res.data})
    localStorage.setItem("token", res.data.token);
    toast.success("Logged in successfully")

    get().connectSocket()
    setTimeout(() => {
  }, 500)
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Failed to connect to the server. Please check your network and try again.");
      console.error("Login error:", error);
    }
  }finally{
    set({isLoggingIng:false})
  }
},


logout:async() =>{
        try {
            await axiosInstance.post("/auth/logout")
            set({authUser:null})
            toast.success("Logged out successfully")
            get().disconnectSocket()
        } catch (error) {
            toast.error(error.response.data.message)
        }

      },

updateProfile:async(data)=>{
set({isUpdatingProfile:true})
try {
  const res = await axiosInstance.put("/auth/update-profile",data)
  set({authUser:res.data})
  toast.success("Profile updated successfully")
} catch (error) {
  console.log("error in update profile",error)
  toast.error(error.response.data.message)
}finally{
  set({isUpdatingProfile:false})
}
},

connectSocket: () => {
  const { authUser } = get();
  if (!authUser || get().socket?.connected) return;

  const socket = io(BASE_URL, {
    query: {
      userId: authUser._id,
    },
  });
  socket.connect();

  set({ socket: socket });

  socket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });
},
disconnectSocket:()=>{
  if(get().socket?.connected) get().socket.disconnect()
}
}))
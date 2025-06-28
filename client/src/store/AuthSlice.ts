import { createSlice } from "@reduxjs/toolkit";
import type{ User } from "../types/User";

const initialState = {
    user: {} as User
}

 const UserSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setuser: (state, action) => {
            state.user = action.payload
        }
    }
})

export const { setuser } = UserSlice.actions

export default UserSlice.reducer
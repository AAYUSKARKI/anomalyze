import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    endpoint: ""
}

 const EndPointSlice = createSlice({
    name: "endpoint",
    initialState,
    reducers: {
        setendpoint: (state, action) => {
            state.endpoint = action.payload
        }
    }
})

export const { setendpoint } = EndPointSlice.actions

export default EndPointSlice.reducer
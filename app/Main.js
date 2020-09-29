import React, { useState, useReducer, useEffect, Suspense } from "react"
import ReactDOM from "react-dom"
import { useImmerReducer } from "use-immer"
import { BrowserRouter, Switch, Route } from "react-router-dom"
import Axios from "axios"
import { CSSTransition } from "react-transition-group"
Axios.defaults.baseURL = process.env.BACKENDURL || "https://retrochatbackend.herokuapp.com"

import StateContext from "./StateContext"
import DispatchContext from "./DispatchContext"

// My Components
import Header from "./components/Header"
import HomeGuest from "./components/HomeGuest"
import Home from "./components/Home"
import Footer from "./components/Footer"
import About from "./components/About"
import Terms from "./components/Terms"
const CreatePost = React.lazy(() => import("./components/CreatePost"))
const ViewSinglePost = React.lazy(() => import("./components/ViewSinglePost"))
import FlashMessages from "./components/FlashMessages"
import Profile from "./components/Profile"
import EditPost from "./components/EditPost"
import NotFound from "./components/NotFound"
const Search = React.lazy(() => import("./components/Search"))
const Chat = React.lazy(() => import("./components/Chat"))
import LoadingDotsIcon from "./components/LoadingDotsIcon"

function Main() {
    const initialState = {
        loggedIn: Boolean(localStorage.getItem("complexAppToken")),
        flashMessages: [],
        user: {
            token: localStorage.getItem("complexAppToken"),
            username: localStorage.getItem("complexAppUsername"),
            avatar: localStorage.getItem("complexAppAvatar")
        },
        isSearchOpen: false,
        isChatOpen: false,
        unreadChatCount: 0
    }

    function ourReducer(draft, action) {
        switch (action.type) {
            case "login":
                draft.loggedIn = true
                draft.user = action.data
                break
            case "logout":
                draft.loggedIn = false
                break
            case "flashMessage":
                draft.flashMessages.push(action.value)
                break
            case "openSearch":
                draft.isSearchOpen = true
                break
            case "closeSearch":
                draft.isSearchOpen = false
                break
            case "toggleChat":
                draft.isChatOpen = !draft.isChatOpen
                break
            case "closeChat":
                draft.isChatOpen = false
                break
            case "increamentUnreadChatCount":
                draft.unreadChatCount++
                break
            case "clearUnreadChatCount":
                draft.unreadChatCount = 0
                break
        }
    }
    const [state, dispatch] = useImmerReducer(ourReducer, initialState)

    useEffect(() => {
        if (state.loggedIn) {
            localStorage.setItem("complexAppToken", state.user.token)
            localStorage.setItem("complexAppUsername", state.user.username)
            localStorage.setItem("complexAppAvatar", state.user.avatar)
        } else {
            localStorage.removeItem("complexAppToken")
            localStorage.removeItem("complexAppUsername")
            localStorage.removeItem("complexAppAvatar")
        }
    }, [state.loggedIn])

    /**Check if token is expired or not on first render */
    useEffect(() => {
        if (state.loggedIn) {
            /**Send Axios request here */
            const ourRequest = Axios.CancelToken.source()
            async function fetchResults() {
                try {
                    const response = await Axios.post("/checktoken", { token: state.user.token }, { cancelToken: ourRequest.token })
                    if (!response.data) {
                        dispatch({ type: "logout" })
                        dispatch({ type: "flashMessage", value: "Your session is expired. Please login again" })
                    }
                } catch (e) {
                    console.log("error")
                }
            }
            fetchResults()
            return () => ourRequest.cancel()
        }
    }, [])

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <BrowserRouter>
                    <FlashMessages messages={state.flashMessages} />
                    <Header />
                    <Suspense fallback={<LoadingDotsIcon />}>
                        <Switch>
                            <Route path="/profile/:username">
                                <Profile />
                            </Route>
                            <Route path="/" exact>
                                {state.loggedIn ? <Home /> : <HomeGuest />}
                            </Route>
                            <Route path="/post/:id" exact>
                                <ViewSinglePost />
                            </Route>
                            <Route path="/post/:id/edit" exact>
                                <EditPost />
                            </Route>
                            <Route path="/create-post">
                                <CreatePost />
                            </Route>
                            <Route path="/about-us">
                                <About />
                            </Route>
                            <Route path="/terms">
                                <Terms />
                            </Route>
                            <Route>
                                <NotFound />
                            </Route>
                        </Switch>
                    </Suspense>
                    <CSSTransition timeout={330} in={state.isSearchOpen} classNames="search-overlay" unmountOnExit>
                        <div className="search-overlay">
                            <Suspense fallback="">
                                <Search />
                            </Suspense>
                        </div>
                    </CSSTransition>
                    <Suspense fallback="">{state.loggedIn && <Chat />}</Suspense>
                    <Footer />
                </BrowserRouter>
            </DispatchContext.Provider>
        </StateContext.Provider>
    )
}

ReactDOM.render(<Main />, document.querySelector("#app"))

if (module.hot) {
    module.hot.accept()
}

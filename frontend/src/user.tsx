import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { ClientLoginRequest, ServerLoginResponse } from "./protocol";
import { POST } from "./transport";
import './user.css';


interface UserState {
    session_key: string | undefined;
    username: string;
}

const userState = typeof localStorage.getItem('user_state') !== 'string' ? { session_key: undefined, username: "" } : JSON.parse(localStorage.getItem('user_state')!) as UserState;

function getUserState(): UserState {
    return userState;
}

function storeUserState() {
    localStorage.setItem('user_state', JSON.stringify(userState));
}


export function UserBar() {
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
    const [isLoggedIn, setIsLoggedIn] = React.useState(typeof getUserState().session_key === 'string');


    const openLoginDialog = () => {
        setLoginDialogOpen(true);
    }

    const logout = () => {
        getUserState().session_key = undefined;
        getUserState().username = "";
        storeUserState();
        setIsLoggedIn(false);
    }

    return (
        <div className="floating-user-bar">
            {
                isLoggedIn ? 
                <div>
                    <Button onClick={logout}>Logout {getUserState().username}</Button>
                </div>
                :
                <div>
                    <Button onClick={openLoginDialog}>Login</Button>
                    <Button onClick={registerUser}>Register</Button>
                </div>
            }
            { LoginDialog(loginDialogOpen, setLoginDialogOpen, setIsLoggedIn) }
        </div>
    )
}


function registerUser() {
    alert(`todo register`);
}

function LoginDialog(loginDialogOpen: boolean,
    setLoginDialogOpen: (open: boolean) => void,
    setIsLoggedIn: (isLoggedIn: boolean) => void): React.ReactFragment {

    let username = "";
    let password = "";

    const handleUsernameChanged = (event: any) => {
        username = event.target.value;
    }
    const handlePasswordChanged = (event: any) => {
        password = event.target.value;
    }

    const handleClose = async (event: React.MouseEvent<HTMLButtonElement>) => {
        setLoginDialogOpen(false);
        if (event.currentTarget.id === 'login') {
            // Login with server
            const req: ClientLoginRequest = {
                username: username,
                pass: password, // TODO Hash?
            };
            try {
                const reply = await POST<ServerLoginResponse>('/login', JSON.stringify(req));
                console.log("Received session_key: " + reply.session_key);
                getUserState().username = username;
                getUserState().session_key = reply.session_key;
                storeUserState();
                setIsLoggedIn(true);
            } catch (e) {
                alert(`Failed to login: ${e}`);
            }
        }
    }

    return (
        <Dialog open={loginDialogOpen} onClose={handleClose}>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Username"
                type="email"
                fullWidth
                variant="standard"
                onChange={handleUsernameChanged}
            />
            <TextField
                margin="dense"
                id="name"
                label="password"
                type="password"
                fullWidth
                variant="standard"
                onChange={handlePasswordChanged}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={handleClose} id='cancel'>Cancel</Button>
            <Button onClick={handleClose} id='login'>Login</Button>
            </DialogActions>
        </Dialog>
    );
}


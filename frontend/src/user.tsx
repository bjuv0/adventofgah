import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { ClientLoginRequest, ServerLoginResponse, ServerRegisterUserResponse } from "./protocol";
import { POST, PUT } from "./transport";
import './user.css';
import { Md5 } from 'ts-md5/dist/md5';


interface UserState {
    session_key: string | undefined;
    username: string;
}

const userState = typeof localStorage.getItem('user_state') !== 'string' ? { session_key: undefined, username: "" } : JSON.parse(localStorage.getItem('user_state')!) as UserState;

export function getUserState(): UserState {
    return userState;
}

function storeUserState() {
    localStorage.setItem('user_state', JSON.stringify(userState));
}


export function UserBar() {
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
    const [welcomeDialogOpen, setWelcomeDialogOpen] = React.useState(false);
    const [isLoginKind, setIsLoginKind] = React.useState(false);
    const [isLoggedIn, setIsLoggedIn] = React.useState(typeof getUserState().session_key === 'string');


    const openLoginDialog = () => {
        setLoginDialogOpen(true);
        setIsLoginKind(true);
    }

    const openRegisterDialog = () => {
        setLoginDialogOpen(true);
        setIsLoginKind(false);
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
                        <Button onClick={openRegisterDialog}>Register</Button>
                    </div>
            }
            {LoginDialog(loginDialogOpen, isLoginKind, setLoginDialogOpen, setIsLoggedIn, setWelcomeDialogOpen)}
            {welcomeDialog(welcomeDialogOpen, setWelcomeDialogOpen)}
        </div>
    )
}

function welcomeDialog(welcomeDialogOpen: boolean,
    setWelcomeDialogOpen: (open: boolean) => void): React.ReactFragment {

    const handleClose = async (event: React.MouseEvent<HTMLButtonElement>) => {
        setWelcomeDialogOpen(false);
    }

    return (
        <Dialog open={welcomeDialogOpen} onClose={handleClose}>
            <DialogTitle>Welome {getUserState().username}!!</DialogTitle>
            <DialogContent>Nice of you to join Advent of Gah</DialogContent>
            <DialogActions>
                <Button onClick={handleClose} id='cancel'>Ok</Button>
            </DialogActions>
        </Dialog>
    );
}

function LoginDialog(loginDialogOpen: boolean, isLoginKind: boolean,
    setLoginDialogOpen: (open: boolean) => void,
    setIsLoggedIn: (isLoggedIn: boolean) => void,
    setWelcomeDialogOpen: (welcome: boolean) => void): React.ReactFragment {

    let username = "";
    let password = "";

    let kind = isLoginKind ? "Login" : "Register";

    const handleUsernameChanged = (event: any) => {
        username = event.target.value;
    }
    const handlePasswordChanged = (event: any) => {
        password = event.target.value;
    }

    const handleClose = async (event: React.MouseEvent<HTMLButtonElement>) => {
        const currentTargetId = event.currentTarget.id;
        setLoginDialogOpen(false);
        if (currentTargetId === 'login' || currentTargetId === 'register') {
            // Login with server
            const req: ClientLoginRequest = {
                username: username,
                pass: Md5.hashStr(password),
            };
            try {
                let reply;
                if (currentTargetId === 'login') {
                    reply = await POST<ServerLoginResponse>('/login', JSON.stringify(req));
                } else {
                    reply = await PUT<ServerRegisterUserResponse>('/register-user', JSON.stringify(req));
                }

                console.log("Received session_key: " + reply.session_key);
                getUserState().username = username;
                getUserState().session_key = reply.session_key;
                storeUserState();
                setIsLoggedIn(true);
                if (currentTargetId === 'register') {
                    setWelcomeDialogOpen(true);
                }
            } catch (e) {
                alert(`Failed to login: ${e}`);
            }
        }
    }

    return (
        <Dialog open={loginDialogOpen} onClose={handleClose}>
            <DialogTitle>{kind}</DialogTitle>
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
                {isLoginKind ? <Button onClick={handleClose} id='login'>{kind}</Button> : <Button onClick={handleClose} id='register'>{kind}</Button>}
            </DialogActions>
        </Dialog>
    );
}


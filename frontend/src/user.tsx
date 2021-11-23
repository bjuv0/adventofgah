import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import React from "react";
import './user.css';

export function UserBar() {
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);

    const openLoginDialog = () => {
        setLoginDialogOpen(true);
    }

    return (
        <div className="floating-user-bar">
            <Button onClick={openLoginDialog}>Login</Button>
            <Button onClick={registerUser}>Register</Button>
            { LoginDialog(loginDialogOpen, setLoginDialogOpen) }
        </div>
    )
}


function registerUser() {
    alert(`todo register`);
}

function LoginDialog(loginDialogOpen: boolean, setLoginDialogOpen: (open: boolean) => void): React.ReactFragment {

    const handleClose = () => {
        setLoginDialogOpen(false);
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
            />
            <TextField
                autoFocus
                margin="dense"
                id="name"
                label="password"
                type="password"
                fullWidth
                variant="standard"
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleClose}>Login</Button>
            </DialogActions>
        </Dialog>
    );
}
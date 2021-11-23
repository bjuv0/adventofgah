import { Button } from "@mui/material";
import './user.css';

export function renderUserBar(): React.ReactFragment {
    return (
        <div className="floating-user-bar">
            <Button onClick={loginUser}>Login</Button>
            <Button onClick={registerUser}>Register</Button>
        </div>
    )
}

function loginUser() {
    alert(`todo login`);
}

function registerUser() {
    alert(`todo register`);
}
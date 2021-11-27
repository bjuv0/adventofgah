import { Paper, styled, Table, TableBody, TableContainer, TableHead, TableRow } from "@mui/material";
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import React from "react";
import { LeaderboardDetail, ServerLeaderboardResponse } from "./protocol";
import { GET } from "./transport";

export function Leaderboard() {
    const [rows, setRows] = React.useState<LeaderboardDetail[]>([]);

    setTimeout(() => {
        if (rows.length === 0) {
            GET<ServerLeaderboardResponse>('/leaderboard')
                .then((reply) => {
                    reply.details.sort((a, b) => {
                        if (a.points < b.points) {
                            return 1;
                        } else if (a.points === b.points) {
                            return a.username < b.username ? 1 : -1;
                        } else {
                            return -1;
                        }
                    });
                    setRows(reply.details);
                })
                .catch(error => console.error(`Failed to get leaderboard info: ${error}`));
        }
    }, 50);

    return (
        <div>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>User</StyledTableCell>
                            <StyledTableCell align='right'>Points</StyledTableCell>
                            <StyledTableCell align='right'>Bike</StyledTableCell>
                            <StyledTableCell align='right'>Run</StyledTableCell>
                            <StyledTableCell align='right'>Walk</StyledTableCell>
                            <StyledTableCell align='right'>Ski</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            rows.map(row => (
                                <StyledTableRow key={row.username}>
                                    <StyledTableCell component='th' scope='row'>{row.username}</StyledTableCell>
                                    <StyledTableCell>{row.points}</StyledTableCell>
                                    <StyledTableCell align='right'>{row.bike_dst}</StyledTableCell>
                                    <StyledTableCell align='right'>{row.run_dst}</StyledTableCell>
                                    <StyledTableCell align='right'>{row.walk_dst}</StyledTableCell>
                                    <StyledTableCell align='right'>{row.ski_dst}</StyledTableCell>
                                </StyledTableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}




// Copy-paste from https://mui.com/components/tables/
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));


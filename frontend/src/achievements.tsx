import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import React from "react";
import { Achievement, Achievements, ServerAchievementsResponse } from "./protocol";
import { GET } from "./transport";
import './achievements.css';
import { isUserLoggedIn } from "./user";
import { renderTrophy } from "./achievementRank";

export function AchievementsComponent() {
    const [data, setData] = React.useState<Achievements | undefined>(undefined);

    if (!isUserLoggedIn()) {
        return (
            <div>Please log in first</div>
        );
    }

    if (typeof data === 'undefined') {
        setTimeout(async () => {
            try {
                const reply = await GET<ServerAchievementsResponse>('/achievements');
                setData(reply);
            } catch (error) {
                console.error(`Failed to get achievements ${error}`);
            }
        });
    }

    let unlockedNumCounter = 0;
    return (
        <div>
            <br />
            {
                typeof data === 'undefined' ?
                    <CircularProgress variant="indeterminate" />
                    :
                    <CircularProgressWithLabel value={data.unlocked * 100 / data.total} total={data.total} unlocked={data.unlocked} />
            }
            <br />
            {
                typeof data === 'undefined' ?
                    <br />
                    :
                    data.achievements.map(a => {
                        if (a.unlocked) {
                            unlockedNumCounter++;
                        }
                        return renderAchievement(a, unlockedNumCounter);
                    })
            }
        </div>
    )
}

export function renderAchievement(achievement: Achievement, unlockedNum: number): React.ReactFragment {
    console.log(achievement)
    return (
        <div className={achievement.unlocked ? "achievement-unlocked" : "achievement-locked"} key={achievement.title} style={{ animationDelay: `${unlockedNum * 0.1}s` }}>
            <Paper elevation={10} >
                <Typography variant="caption" component="div" >{renderTrophy(achievement.rank)}</Typography>
                <Typography variant="caption" component="div" color="text.primary">{achievement.title}</Typography>
                <Typography variant="caption" component="div" color="text.secondary">{achievement.description}</Typography>
            </Paper>
        </div>
    )
}

// Highly inspired from https://mui.com/components/progress/
function CircularProgressWithLabel(props: { value: number, total: number, unlocked: number }) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" {...props} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                    <br />
                    {`${props.unlocked}/${props.total}`}
                </Typography>
            </Box>
        </Box>
    );
}
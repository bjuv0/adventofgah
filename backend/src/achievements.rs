use crate::db::Activity;
use serde_derive::{Deserialize, Serialize};
use strum_macros::EnumIter;

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, EnumIter, Hash, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum AchievementRank {
    Bronze,
    Silver,
    Gold,
    Diamond,
}

#[derive(Debug)]
pub enum AchievementType {
    UnlockType(usize),
    Streak(i32, Activity),
    Distance(f64, Activity),
    ActivityCount(i32, Activity),
    AtDate(i32),
    FullCalender(),
}

#[derive(Debug)]
pub struct AchievementData {
    pub title: String,
    pub description: String,
    pub rank: AchievementRank,
    pub achievement_type: AchievementType,
}

pub fn get_achievements() -> Vec<AchievementData> {
    vec![
        AchievementData {
            title: "Game on".to_string(),
            description: "Register one activity".to_string(),
            rank: AchievementRank::Bronze,
            achievement_type: AchievementType::UnlockType(1),
        },
        AchievementData {
            title: "Alternative training".to_string(),
            description: "Register two different activity types".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::UnlockType(2),
        },
        AchievementData {
            title: "Multisport master".to_string(),
            description: "Register all different activity types".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::UnlockType(4),
        },
        AchievementData {
            title: "Walk of life".to_string(),
            description: "Register one walk activity".to_string(),
            rank: AchievementRank::Bronze,
            achievement_type: AchievementType::ActivityCount(1, Activity::WALK),
        },
        AchievementData {
            title: "Keep on walking".to_string(),
            description: "Register three walk activities".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::ActivityCount(3, Activity::WALK),
        },
        AchievementData {
            title: "Walk this way".to_string(),
            description: "Register six walk activities".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::ActivityCount(6, Activity::WALK),
        },
        AchievementData {
            title: "Moon walker".to_string(),
            description: "Register ten walk activities".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::ActivityCount(10, Activity::WALK),
        },
        AchievementData {
            title: "Run forrest run".to_string(),
            description: "Register one run activity".to_string(),
            rank: AchievementRank::Bronze,
            achievement_type: AchievementType::ActivityCount(1, Activity::RUN),
        },
        AchievementData {
            title: "Keep on running".to_string(),
            description: "Register three run activities".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::ActivityCount(3, Activity::RUN),
        },
        AchievementData {
            title: "Run to the hills".to_string(),
            description: "Register six run activities".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::ActivityCount(6, Activity::RUN),
        },
        AchievementData {
            title: "No one can stop you".to_string(),
            description: "Register ten run activities".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::ActivityCount(10, Activity::RUN),
        },
        AchievementData {
            title: "I want to ride my bicycle".to_string(),
            description: "Register one bike activity".to_string(),
            rank: AchievementRank::Bronze,
            achievement_type: AchievementType::ActivityCount(1, Activity::BIKE),
        },
        AchievementData {
            title: "Saddle sore".to_string(),
            description: "Register three bike activities".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::ActivityCount(3, Activity::BIKE),
        },
        AchievementData {
            title: "It's leg day".to_string(),
            description: "Register six bike activities".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::ActivityCount(6, Activity::BIKE),
        },
        AchievementData {
            title: "The pain cave is my home".to_string(),
            description: "Register ten bike activities".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::ActivityCount(10, Activity::BIKE),
        },
        AchievementData {
            title: "Let it snow".to_string(),
            description: "Register one ski activity".to_string(),
            rank: AchievementRank::Bronze,
            achievement_type: AchievementType::ActivityCount(1, Activity::SKI),
        },
        AchievementData {
            title: "Double pole is the shit".to_string(),
            description: "Register three ski activities".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::ActivityCount(3, Activity::SKI),
        },
        AchievementData {
            title: "Need more wax".to_string(),
            description: "Register six ski activities".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::ActivityCount(6, Activity::SKI),
        },
        AchievementData {
            title: "Swix blue extra for breakfast".to_string(),
            description: "Register ten ski activities".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::ActivityCount(10, Activity::SKI),
        },
        AchievementData {
            title: "Half marathon".to_string(),
            description: "Register 21k running".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Distance(21.0, Activity::RUN),
        },
        AchievementData {
            title: "Marathon".to_string(),
            description: "Register 42k running".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::Distance(42.0, Activity::RUN),
        },
        AchievementData {
            title: "Century ride".to_string(),
            description: "Register 100k cycle".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Distance(100.0, Activity::BIKE),
        },
        AchievementData {
            title: "VR315".to_string(),
            description: "Register 315k cycle".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Distance(315.0, Activity::BIKE),
        },
        AchievementData {
            title: "Vasaloppet".to_string(),
            description: "Register 90k skiing".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Distance(90.0, Activity::SKI),
        },
        AchievementData {
            title: "Run x3".to_string(),
            description: "Three running days in a row".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Streak(3, Activity::RUN),
        },
        AchievementData {
            title: "Run x5".to_string(),
            description: "Five running days in a row".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::Streak(5, Activity::RUN),
        },
        AchievementData {
            title: "Run x7".to_string(),
            description: "Seven running days in a row".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Streak(7, Activity::RUN),
        },
        AchievementData {
            title: "Bike x3".to_string(),
            description: "Three biking days in a row".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Streak(3, Activity::BIKE),
        },
        AchievementData {
            title: "Bike x5".to_string(),
            description: "Five biking days in a row".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::Streak(5, Activity::BIKE),
        },
        AchievementData {
            title: "Bike x7".to_string(),
            description: "Seven biking days in a row".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Streak(7, Activity::BIKE),
        },
        AchievementData {
            title: "Walk x3".to_string(),
            description: "Three walking days in a row".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Streak(3, Activity::WALK),
        },
        AchievementData {
            title: "Walk x5".to_string(),
            description: "Five walking days in a row".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::Streak(5, Activity::WALK),
        },
        AchievementData {
            title: "Walk x7".to_string(),
            description: "Seven walking days in a row".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Streak(7, Activity::WALK),
        },
        AchievementData {
            title: "Ski x3".to_string(),
            description: "Three skiing days in a row".to_string(),
            rank: AchievementRank::Silver,
            achievement_type: AchievementType::Streak(3, Activity::SKI),
        },
        AchievementData {
            title: "Ski x5".to_string(),
            description: "Five skiing days in a row".to_string(),
            rank: AchievementRank::Gold,
            achievement_type: AchievementType::Streak(5, Activity::SKI),
        },
        AchievementData {
            title: "Ski x7".to_string(),
            description: "Seven skiing days in a row".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::Streak(7, Activity::SKI),
        },
        AchievementData {
            title: "Active every day".to_string(),
            description: "Register an activety every day".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::FullCalender(),
        },
        AchievementData {
            title: "Ho Ho Ho".to_string(),
            description: "Register an activety on Christmas eve".to_string(),
            rank: AchievementRank::Diamond,
            achievement_type: AchievementType::AtDate(23),
        },
    ]
}

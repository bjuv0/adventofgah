import { faTrophy, faGem } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AchievementRank } from './protocol';

export function renderTrophy(rank: AchievementRank): React.ReactFragment {
    switch (rank) {
        case 'BRONZE': return <FontAwesomeIcon icon={faTrophy} color="#B08D57" />;
        case 'SILVER': return <FontAwesomeIcon icon={faTrophy} color="#BBC2CC" />;
        case 'GOLD': return <FontAwesomeIcon icon={faTrophy} color="#FFD700" />;
        case 'DIAMOND': return <FontAwesomeIcon icon={faGem} color="#B9F2FF" />;
    }
}
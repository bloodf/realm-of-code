// Every scene of the game.
import { Title } from './Title';
import { Create } from './Create';
import { WorldScene } from '../world/WorldScene';
import { Hud } from './Hud';
import { Toasts } from './Toasts';
import { Lesson } from './lesson/Lesson';
import { Minigame } from './games/Minigame';
import { FarmLevelScene } from './farm/FarmLevel';
import { FarmScene } from '../farm/FarmScene';
import { HelpPanel } from './help/HelpPanel';
import { Tour } from './help/Tour';
import { Coach } from './help/Coach';
import { HelpWindow } from './help/HelpWindow';
import { Verify } from './Verify';
import { PetsWindow } from './windows/Pets';
import { GateWindow } from './windows/Gate';
import { Homestead } from './home/Homestead';
import { HomeHud } from './home/HomeHud';
import { Battle } from './battle/Battle';
import { InboxWindow, WelcomeBackWindow } from './windows/Inbox';
import { Debug, DevBadge } from './dev/Debug';
import { AcademyWindow } from './windows/Academy';
import { TavernWindow, FarmWindow } from './windows/Tavern';
import { GuildWindow, LibraryWindow, TrophyWindow, CottageWindow, SettingsWindow, PathBoardWindow } from './windows/simple';

export const SCENES = [
  Title, Create, WorldScene, Hud,
  AcademyWindow, FarmWindow, TavernWindow,
  GuildWindow, LibraryWindow, TrophyWindow, CottageWindow, SettingsWindow, PathBoardWindow, HelpWindow, PetsWindow, GateWindow, InboxWindow, WelcomeBackWindow,
  Lesson, Minigame, FarmLevelScene, FarmScene, Homestead, HomeHud, Battle,
  HelpPanel, Tour, Coach, Toasts, Verify, Debug, DevBadge,
];

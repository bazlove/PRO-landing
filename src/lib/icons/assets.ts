import magnifyingGlassRegular from "../../assets/icons/phosphor/regular/magnifying-glass-regular.svg?raw";
import funnelRegular from "../../assets/icons/phosphor/regular/funnel-regular.svg?raw";
import xRegular from "../../assets/icons/phosphor/regular/x-regular.svg?raw";
import checkRegular from "../../assets/icons/phosphor/regular/check-regular.svg?raw";
import plusRegular from "../../assets/icons/phosphor/regular/plus-regular.svg?raw";
import minusRegular from "../../assets/icons/phosphor/regular/minus-regular.svg?raw";
import pencilSimpleRegular from "../../assets/icons/phosphor/regular/pencil-simple-regular.svg?raw";
import trashRegular from "../../assets/icons/phosphor/regular/trash-regular.svg?raw";
import copyRegular from "../../assets/icons/phosphor/regular/copy-regular.svg?raw";
import shareNetworkRegular from "../../assets/icons/phosphor/regular/share-network-regular.svg?raw";
import arrowSquareOutRegular from "../../assets/icons/phosphor/regular/arrow-square-out-regular.svg?raw";
import caretDownRegular from "../../assets/icons/phosphor/regular/caret-down-regular.svg?raw";
import caretUpRegular from "../../assets/icons/phosphor/regular/caret-up-regular.svg?raw";
import caretLeftRegular from "../../assets/icons/phosphor/regular/caret-left-regular.svg?raw";
import caretRightRegular from "../../assets/icons/phosphor/regular/caret-right-regular.svg?raw";
import arrowLeftRegular from "../../assets/icons/phosphor/regular/arrow-left-regular.svg?raw";
import arrowRightRegular from "../../assets/icons/phosphor/regular/arrow-right-regular.svg?raw";
import houseRegular from "../../assets/icons/phosphor/regular/house-regular.svg?raw";
import listRegular from "../../assets/icons/phosphor/regular/list-regular.svg?raw";
import squaresFourRegular from "../../assets/icons/phosphor/regular/squares-four-regular.svg?raw";
import listBulletsRegular from "../../assets/icons/phosphor/regular/list-bullets-regular.svg?raw";
import heartRegular from "../../assets/icons/phosphor/regular/heart-regular.svg?raw";
import heartFill from "../../assets/icons/phosphor/fill/heart-fill.svg?raw";
import bookmarkSimpleRegular from "../../assets/icons/phosphor/regular/bookmark-simple-regular.svg?raw";
import bookmarkSimpleFill from "../../assets/icons/phosphor/fill/bookmark-simple-fill.svg?raw";
import starRegular from "../../assets/icons/phosphor/regular/star-regular.svg?raw";
import starFill from "../../assets/icons/phosphor/fill/star-fill.svg?raw";
import arrowsLeftRightRegular from "../../assets/icons/phosphor/regular/arrows-left-right-regular.svg?raw";
import buildingsRegular from "../../assets/icons/phosphor/regular/buildings-regular.svg?raw";
import briefcaseRegular from "../../assets/icons/phosphor/regular/briefcase-regular.svg?raw";
import mapPinRegular from "../../assets/icons/phosphor/regular/map-pin-regular.svg?raw";
import globeRegular from "../../assets/icons/phosphor/regular/globe-regular.svg?raw";
import usersRegular from "../../assets/icons/phosphor/regular/users-regular.svg?raw";
import linkRegular from "../../assets/icons/phosphor/regular/link-regular.svg?raw";
import identificationCardRegular from "../../assets/icons/phosphor/regular/identification-card-regular.svg?raw";
import checkCircleRegular from "../../assets/icons/phosphor/regular/check-circle-regular.svg?raw";
import clockRegular from "../../assets/icons/phosphor/regular/clock-regular.svg?raw";
import arrowsClockwiseRegular from "../../assets/icons/phosphor/regular/arrows-clockwise-regular.svg?raw";
import warningRegular from "../../assets/icons/phosphor/regular/warning-regular.svg?raw";
import infoRegular from "../../assets/icons/phosphor/regular/info-regular.svg?raw";
import questionRegular from "../../assets/icons/phosphor/regular/question-regular.svg?raw";
import fileTextRegular from "../../assets/icons/phosphor/regular/file-text-regular.svg?raw";
import bookOpenRegular from "../../assets/icons/phosphor/regular/book-open-regular.svg?raw";
import shieldCheckRegular from "../../assets/icons/phosphor/regular/shield-check-regular.svg?raw";
import sealCheckRegular from "../../assets/icons/phosphor/regular/seal-check-regular.svg?raw";
import chartBarRegular from "../../assets/icons/phosphor/regular/chart-bar-regular.svg?raw";
import chatCircleTextRegular from "../../assets/icons/phosphor/regular/chat-circle-text-regular.svg?raw";
import diamondRegular from "../../assets/icons/phosphor/regular/diamond-regular.svg?raw";
import lockRegular from "../../assets/icons/phosphor/regular/lock-regular.svg?raw";
import lockOpenRegular from "../../assets/icons/phosphor/regular/lock-open-regular.svg?raw";
import sparkleRegular from "../../assets/icons/phosphor/regular/sparkle-regular.svg?raw";
import bellRegular from "../../assets/icons/phosphor/regular/bell-regular.svg?raw";
import bellFill from "../../assets/icons/phosphor/fill/bell-fill.svg?raw";
import gearRegular from "../../assets/icons/phosphor/regular/gear-regular.svg?raw";
import userRegular from "../../assets/icons/phosphor/regular/user-regular.svg?raw";
import signInRegular from "../../assets/icons/phosphor/regular/sign-in-regular.svg?raw";
import type { ProductIconId } from "./registry";

export interface ProductIconAssetSet {
  regular: string;
  fill?: string;
}

export const productIconAssets = {
  search: { regular: magnifyingGlassRegular },
  filter: { regular: funnelRegular },
  close: { regular: xRegular },
  confirm: { regular: checkRegular },
  add: { regular: plusRegular },
  remove: { regular: minusRegular },
  edit: { regular: pencilSimpleRegular },
  delete: { regular: trashRegular },
  copy: { regular: copyRegular },
  share: { regular: shareNetworkRegular },
  "external-link": { regular: arrowSquareOutRegular },
  "chevron-down": { regular: caretDownRegular },
  "chevron-up": { regular: caretUpRegular },
  "chevron-left": { regular: caretLeftRegular },
  "chevron-right": { regular: caretRightRegular },
  back: { regular: arrowLeftRegular },
  forward: { regular: arrowRightRegular },
  home: { regular: houseRegular },
  menu: { regular: listRegular },
  "grid-view": { regular: squaresFourRegular },
  "list-view": { regular: listBulletsRegular },
  favorite: { regular: heartRegular, fill: heartFill },
  bookmark: { regular: bookmarkSimpleRegular, fill: bookmarkSimpleFill },
  "rating-star": { regular: starRegular, fill: starFill },
  compare: { regular: arrowsLeftRightRegular },
  company: { regular: buildingsRegular },
  vacancy: { regular: briefcaseRegular },
  location: { regular: mapPinRegular },
  world: { regular: globeRegular },
  people: { regular: usersRegular },
  link: { regular: linkRegular },
  profile: { regular: identificationCardRegular },
  verified: { regular: checkCircleRegular },
  stale: { regular: clockRegular },
  refresh: { regular: arrowsClockwiseRegular },
  conflict: { regular: warningRegular },
  information: { regular: infoRegular },
  unknown: { regular: questionRegular },
  source: { regular: fileTextRegular },
  methodology: { regular: bookOpenRegular },
  protected: { regular: shieldCheckRegular },
  certified: { regular: sealCheckRegular },
  "employer-claim": { regular: buildingsRegular },
  "platform-analysis": { regular: chartBarRegular },
  "user-content": { regular: chatCircleTextRegular },
  premium: { regular: diamondRegular },
  locked: { regular: lockRegular },
  unlocked: { regular: lockOpenRegular },
  insight: { regular: sparkleRegular },
  notifications: { regular: bellRegular, fill: bellFill },
  settings: { regular: gearRegular },
  user: { regular: userRegular },
  "sign-in": { regular: signInRegular },
} as const satisfies Record<ProductIconId, ProductIconAssetSet>;

import { OCRLangType } from "types";

export const DEFAULT_TAG_BG_COLOR = '#c41fff';
export const DEFAULT_TAG_FG_COLOR = '#ffffff';
// ID of the DOM element where modals are created
export const MODALS = 'modals'; // ID of the DOM element
export const DATA_TYPE_NODES = 'type/nodes';
export const DATA_TRANSFER_EXTRACTED_PAGES = 'type/extracted-pages';

export const OCR_LANG: OCRLangType = {
  'eng': 'English',
  'deu': 'Deutsch',
  'fra': 'Français',
  'spa': 'Español',
  'ita': 'Italiano',
  'ron': 'Română',
  'por': 'Português',
  'osd': 'osd'
}

export const HIDDEN = { // far away coordinates
  x: -100000,
  y: -100000
}

// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.auth = exports.db = void 0;
// var admin = require("firebase-admin");
// var initialized = false;
// function init() {
//     if (!initialized) {
//         admin.initializeApp();
//         initialized = true;
//     }
//     return admin;
// }
// var db = function () { return init().firestore(); };
// exports.db = db;
// var auth = function () { return init().auth(); };
// exports.auth = auth;

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function ensureAdmin() {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore();
}

// Optional convenience wrapper (if you like calling db())
export const db = () => ensureAdmin();

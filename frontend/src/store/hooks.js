/**
 * @file     frontend/src/store/hooks.js
 * @location frontend/src/store/hooks.js
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Typed Redux hooks (useAppDispatch, useAppSelector).
 * Dùng thay vì useDispatch/useSelector trực tiếp.
 * ─────────────────────────────────────────────────────────────────
 */

import { useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
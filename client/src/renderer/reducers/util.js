// @flow
import type { Action } from 'redux';

/**
 * Slices the state into the given path, and propagates an action through that slice.
 * @param path The path of the slice
 * @param reducer The reducer that will receive that slice and the action to be propagated
 * @returns {applyActionToSlice}
 */
const slicer = (path: Array<string>, reducer: (any, Action) => any) =>
  /**
   * @name applyActionToSlice
   * Applies an action into the slice in the given path and propagates it to the reducer that was
   * used to create the function. Also allows some runtime path concatenation for dynamic
   * generated slices.
   * @param mutableState The state that will be sliced. This one needs to be mutable, and have
   * #getIn(Array<string>) and #setIn(Array<string>, data) methods to allow getting and
   * setting information in the state.
   * @param action The action that will be applied to the slice.
   * @param restPath The last part of the path to allow dynamic generated slices. It is relative
   * to the path given when the function was created.
   */
  (mutableState: any, action: Action, restPath: Array<string> = []) => {
    const fullPath = path.concat(restPath);
    mutableState.setIn(fullPath, reducer(mutableState.getIn(fullPath), action));
  };

export default slicer;

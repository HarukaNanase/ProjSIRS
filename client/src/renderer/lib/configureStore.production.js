import type { Middleware, Store } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { State } from '../reducers';
import rootReducer from '../reducers';

const configureStore = (initialState: ?State, ...middlewares: Array<Middleware>): Store<State> =>
  createStore(rootReducer, initialState,
    applyMiddleware(
      thunk,
      ...middlewares,
    ));

export default configureStore;
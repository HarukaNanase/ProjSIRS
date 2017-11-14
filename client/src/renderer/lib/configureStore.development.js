import type { Middleware, Store } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import rootReducer from '../reducers/index';
import type { State } from '../reducers/index';

const composeEnhancers = composeWithDevTools({
  actionsBlacklist: ['REDUX_STORAGE_SAVE']
});

const configureStore = (initialState: ?State, ...middlewares: Array<Middleware>): Store<State> => {
  const store = createStore(
    rootReducer,
    initialState,
    composeEnhancers(
      applyMiddleware(
        thunk,
        ...middlewares,
      )
    ));

  if (module.hot) {
    module.hot.accept('../reducers', () =>
      store.replaceReducer(require('../reducers/index')));
  }

  return store;
};

export default configureStore;
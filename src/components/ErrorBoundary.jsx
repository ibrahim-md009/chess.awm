import { Component } from 'react';
import { ar } from '../i18n/ar.js';

/**
 * Last line of defence: if a render throws, show a readable Arabic message
 * instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <div className="panel crash-panel" role="alert">
          <h1 className="panel-title">{ar.errorBoundary.title}</h1>
          <p>{ar.errorBoundary.body}</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            {ar.errorBoundary.reload}
          </button>
        </div>
      </div>
    );
  }
}

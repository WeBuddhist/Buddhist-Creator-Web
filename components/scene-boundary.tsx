"use client";

import { Component, type ReactNode } from "react";

/* A WebGL scene is an enhancement: whatever goes wrong in it (no WebGL
   context to be had, a driver that fails a shader), the page keeps what
   it shows without it and says nothing. Used by the leaderboard's podium
   cards and the awards medal. */
export class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

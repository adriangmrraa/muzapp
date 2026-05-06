"use client";

import { useEffect } from "react";
import { captureUTMFromURL } from "@/lib/attribution/utm-capture";

export function UTMCaptureScript() {
  useEffect(() => {
    captureUTMFromURL();
  }, []);

  return null;
}

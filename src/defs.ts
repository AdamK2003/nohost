import axios, { AxiosInstance } from "axios";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as YAML from "yaml";
import { readFileSync } from "fs";
import { PostStub } from "./types/types.js";

export interface Config {
  seeds: {
    posts?: PostStub[];
    tags?: string[];
  };
  ratelimits?: {
    posts?: number;
    projects?: number;
    tags?: number;
  };
  concurrency?: {
    posts?: number;
    projects?: number;
    tags?: number;
  };
}

export const config: Config = YAML.parse(readFileSync("config.yml").toString());

export const ax = axios.create({
  baseURL: "https://cohost.org",
  headers: {
    Cookie: process.env.COHOST_COOKIE
      ? `connect.sid=${process.env.COHOST_COOKIE}`
      : undefined,
  },
  validateStatus: function (status: number): boolean {
    return status < 400 || status != 404;
  },
});

const dbClient = createClient({
  url: "file:./cohost.db",
});

export const db = drizzle(dbClient);

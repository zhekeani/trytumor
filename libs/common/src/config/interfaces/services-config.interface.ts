export interface ServiceConfig {
  http_port?: number;
  rmq_port?: number;
  host: string;
}

export interface ServicesConfig {
  auth?: ServiceConfig;
  patients?: ServiceConfig;
  predictions?: ServiceConfig;
}

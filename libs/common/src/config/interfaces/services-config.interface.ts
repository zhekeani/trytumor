export interface ServiceConfig {
  http_port?: number;
  rmq_port?: number;
  host: number;
}

export interface ServicesConfig {
  auth?: ServiceConfig;
  patients?: ServiceConfig;
  predictions?: ServiceConfig;
}

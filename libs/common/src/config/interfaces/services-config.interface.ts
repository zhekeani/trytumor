export interface ServiceConfig {
  http_port?: number;
  rmq_port?: number;
  host: number;
}

export interface ServicesConfig {
  predictions: ServiceConfig;
}

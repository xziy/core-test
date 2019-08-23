import MapConfig from "@webresto/core/adapter/map/core/MapConfig";
import Point from "@webresto/core/adapter/map/core/Point";
import Polygon from "@webresto/core/adapter/map/core/Polygon";

export default abstract class MapInterface {
  protected readonly config: MapConfig;

  protected constructor(config: MapConfig) {
    this.config = config;
  }

  public abstract async getGeocode(street: string, home: number): Promise<Point>;

  public abstract async getPolygons(): Promise<Polygon[]>;

  public abstract checkDotInPolygon(dot: Point, polygon: Polygon): boolean;
}
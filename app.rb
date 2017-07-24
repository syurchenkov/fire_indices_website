require 'sinatra'
require 'json'
require 'sequel'
require './geo_coords.rb'

configure do 
  set :bind, '0.0.0.0'
  set :db, Sequel.sqlite("./../fire_indices_updater/database/database.db")
end
 
get '/' do
  send_file './public/html/index.html'
end

get '/fire_indices' do 
  content_type :json

  a = GeoCoords.new(request[:lon_a].to_f, request[:lat_a].to_f)
  b = GeoCoords.new(request[:lon_b].to_f, request[:lat_b].to_f)

  north_east_point, south_west_point = GeoCoords.to_ne_sw(a, b)

  fire_indices = settings.db[:fire_indices].where{
    (longitude >= south_west_point.longitude360) &
    (longitude <= north_east_point.longitude360) &
    (latitude  >= south_west_point.latitude)  &
    (latitude  <= north_east_point.latitude)
  }.map { |e| e[:nesterov1] }

  {
    :forecast_day_1 => fire_indices,
    :max_lon => north_east_point.longitude180,
    :min_lon => south_west_point.longitude180,
    :max_lat => north_east_point.latitude,
    :min_lat => south_west_point.latitude
  }.to_json
end







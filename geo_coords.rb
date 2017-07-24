class Float
  def round_to_quarter
    (self * 4).round / 4.0
  end
end

class GeoCoords 
  attr_reader :longitude180, :longitude360, :latitude

  # convert 2 points to north-east and south-west
  def self.to_ne_sw(a, b)
    east_longitude, west_longitude = (a.longitude180 > b.longitude180)? [a.longitude180, b.longitude180]: [b.longitude180, a.longitude180]

    north_latitude, south_latitude = (a.latitude > b.latitude)? [a.latitude, b.latitude]: [b.latitude, a.latitude]

    north_east_point = self.new(east_longitude, north_latitude)

    south_west_point = self.new(west_longitude, south_latitude)

    return north_east_point, south_west_point
  end

  def initialize(longitude, latitude)
    raise 'Wrong longitude! It must be between -180 and 180' unless longitude.between?(-180, 180)

    raise 'Wrong latitude! It must be between -90 and 90' unless latitude.between?(-90, 90)

    @longitude180 = longitude.to_f.round_to_quarter

    @longitude360 = (longitude < 0)? (@longitude180 + 360): @longitude180 

    @latitude = latitude.to_f.round_to_quarter
  end

  def to_s
    "#{@longitude}, #{@latitude}"
  end
end
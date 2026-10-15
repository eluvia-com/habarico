module Habarico
  def self.version
    File.read(File.expand_path('../../VERSION', __dir__)).strip
  end
end

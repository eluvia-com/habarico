require_relative "lib/habarico/version"

Gem::Specification.new do |spec|
  spec.name = "habarico"
  spec.version = Habarico.version
  spec.authors = ["Matěj Outlý"]
  spec.email = ["matej.outly@eluvia.com"]
  spec.homepage = "https://www.habarico.com"
  spec.summary = "Model driven administration for Rails applications."
  spec.description = "With this library you can define a bunch of admin resources and connect it to a Habarico frontend to automatically generate an admin user interface."
  spec.license = "MIT"

  # No `allowed_push_host`: the gem is published to rubygems.org.
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/eluvia-com/habarico"
  spec.metadata["changelog_uri"] = "https://github.com/eluvia-com/habarico/blob/master/ruby/CHANGELOG.md"
  spec.metadata["documentation_uri"] = "https://docs.habarico.com/ruby/intro"
  # A trusted-publisher push from publish.yml is exempt; only owners pushing by hand need MFA.
  spec.metadata["rubygems_mfa_required"] = "true"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "VERSION", "LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails", "~> 7.0"
  spec.add_dependency "pundit", "~> 2.5"
  spec.add_dependency "kaminari", "~> 1.0"
  spec.add_dependency "eluvia-base", ">= 3.39.0"
end

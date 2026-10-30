# Mirrors Django's console e-mail backend: in development the password reset link is printed
# where the server runs. ActionMailer ships no such delivery method of its own.
class ConsoleDelivery
  def initialize(_settings = {}); end

  def deliver!(mail)
    $stdout.puts(mail.to_s)
  end
end

ActionMailer::Base.add_delivery_method(:console, ConsoleDelivery)

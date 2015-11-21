require File.expand_path('../boot', __FILE__)

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module DJonYoutube
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    config.time_zone = 'Tokyo'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    config.i18n.load_path += Dir[Rails.root.join('config', 'locales', '**', '*.{rb,yml}').to_s] #i18n(多言語に対応するためのライブラリ)の設定ファイルのディレクトリ指定
    config.i18n.default_locale = :ja

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true

    config.generators do |g|
      g.helper false # rails generateしたときに、ヘルパーを自動生成しない
      g.assets false # 　　　　　　　　　　　　　アセット(SCSSとCoffeeScriptファイル)
      g.test_framework :rspec # テスティングフレームワークの設定
      g.view_specs false # viewのテストを自動生成しない
    end

    config.web_console.whitelisted_ips = '192.168.33.1'
  end
end

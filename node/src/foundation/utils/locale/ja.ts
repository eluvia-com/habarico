/* eslint-disable sonarjs/no-hardcoded-passwords -- i18n translation keys, not credentials */
import type {TranslationMessages} from 'ra-core';
import * as japaneseMessagesModule from '@bicstone/ra-language-japanese';
import type {LocaleMessages} from './types';

// The Japanese language pack ships as CommonJS (`exports.default = messages`). Bundlers wrap the
// interop differently — tsc/vite expose the messages object directly, while Storybook's rolldown
// nests it one (or two) `.default` levels deep — so unwrap `.default` until the actual messages
// object (the one carrying `ra`) is reached. Fixes the runtime crash when the full locale barrel is
// bundled (e.g. via `BaseAdmin`'s i18n provider).
const resolveMessages = (mod: unknown): TranslationMessages => {
  let candidate = mod as {ra?: unknown; default?: unknown} | undefined;
  while (candidate && !candidate.ra && candidate.default) {
    candidate = candidate.default as {ra?: unknown; default?: unknown};
  }
  return candidate as TranslationMessages;
};

const japaneseMessages = resolveMessages(japaneseMessagesModule);

export const jaMessages: LocaleMessages = {
  ra: {
    ...japaneseMessages.ra,
    array_input: {
      count: '%{count} 件',
      empty: '項目がありません',
      more_actions: 'その他の操作',
    },
    configurable: {
      customize: 'カスタマイズ',
      configureMode: 'このページを設定',
      inspector: {
        title: 'インスペクター',
        content: 'UI要素にマウスを合わせて設定する',
        reset: '設定をリセット',
        hideAll: 'すべて非表示',
        showAll: 'すべて表示',
      },
      Datagrid: {
        title: 'データグリッド',
        unlabeled: 'ラベルなし列 #%{column}',
      },
      SimpleForm: {
        title: 'フォーム',
        unlabeled: 'ラベルなしフィールド #%{input}',
      },
      SimpleList: {
        title: 'リスト',
        primaryText: 'プライマリテキスト',
        secondaryText: 'セカンダリテキスト',
        tertiaryText: 'ターシャリテキスト',
      },
    },
    saved_queries: {
      label: '保存されたフィルター',
      help: 'リストをフィルタリングして、このフィルターを後で保存します',
      new_dialog_title: 'フィルターを保存',
      query_name: 'フィルター名',
      new_label: '現在のフィルターを保存...',
      remove_label_with_name: '保存済みフィルターを削除: %{name}',
      remove_dialog_title: '保存済みフィルターを削除しますか？',
      remove_message: '保存済みフィルターを本当に削除しますか？',
      remove_label: '保存済みフィルターを削除',
    },
    guesser: {
      empty: {
        title: '表示するデータがありません',
        message: 'データプロバイダーを確認してください',
      },
    },
    validation: {
      ...japaneseMessages.ra.validation,
      unique: '一意である必要があります',
      invalid_format: '形式が無効です',
      czech_id_card_number: '身分証明書番号が無効です',
    },
    action: {
      ...japaneseMessages.ra.action,
      create: '作成',
      remove_all_filters: 'フィルタリングをキャンセル',
      remove_saved_queries: '保存済みフィルターをすべて削除',
      clear_array_input: 'リストをクリア',
      select_columns: '列を選択',
      sort: '並び替え',
      submit: '送信',
      ai_generate: '生成',
      reset_filters: 'フィルターをリセット',
      next: '続ける',
      prev: '前へ',
      action: 'アクション',
      one_of: '%{total}件中%{current}件',
      open_filters: 'フィルターを開く',
      close_filters: 'フィルターを閉じる',
      reset_datagrid_settings: 'テーブル設定をリセット',
      reset_datagrid_settings_confirm: 'テーブル設定をリセットしますか？',
      reset_datagrid_columns: '列幅を自動調整',
      resize_column: '列幅を変更',
      reset_datagrid_columns_confirm: '列幅を自動調整しますか？',
      reset_datagrid_sort: '並び替えをリセット',
      reset_datagrid_filters: 'フィルターをリセット',
      show_record: 'オブジェクトを表示',
      edit_record: 'オブジェクトを編集',
      drag_to_reorder: 'ドラッグして並べ替え',
      export: 'エクスポート',
      more_actions: 'その他の操作',
    },
    message: {
      ...japaneseMessages.ra.message,
      not_found:
        '申し訳ありませんが、お探しのページは存在しません。もう一度お試しいただくか、戻ってください。',
      clear_array_input: 'リスト全体をクリアしてもよろしいですか？',
      action_successful: '正常に完了しました',
      successfully_done: '正常に完了しました',
      action_running: 'タスクが開始されました',
      action_error: 'タスクが失敗しました',
      invalid_ico: 'ICO値が無効です',
      schema_error: 'スキーマの読み込みエラー',
      reset_datagrid_settings_confirm:
        'テーブルはデフォルト設定にリセットされます。フィルター、並び順、列設定がデフォルト値にリセットされます。',
      reset_datagrid_columns_confirm: '列幅をデフォルト値に自動調整しますか？',
    },
    navigation: {
      ...japaneseMessages.ra.navigation,
      or: 'または',
    },
    page: {
      ...japaneseMessages.ra.page,
      create: '%{name} - 作成',
      empty: '"%{name}"はまだありません',
    },
    auth: {
      ...japaneseMessages.ra.auth,

      // Google login
      or: 'または',
      sign_in_with_google: 'Google でログイン',

      mfa_select_method: '確認方法を選択してください',
      mfa_verify: '確認コードを入力してください',

      // Mfa methods
      mfa_method_email: 'メール',
      mfa_method_sms: 'SMS',

      // Forgotten password
      forgotten_password: 'パスワードリセットメールを送信',
      forgotten_password_instructions:
        'メールアドレスをご入力ください。パスワードを回復するためのリンクをお送りします。',
      forgotten_password_button: 'パスワードをお忘れですか？',
      forgotten_password_success: 'パスワードリセットメールを送信しました',
      forgotten_password_error: '無効なメールアドレスです',

      // Reset password
      reset_password: '新しいパスワードを設定',
      reset_password_instructions: '新しいパスワードを設定し、確認のため再入力してください。',
      reset_password_success: 'パスワードが正常に設定されました',
      reset_password_error: 'パスワード変更トークンが無効です',

      // Change password
      change_password: 'パスワードを変更',
      change_password_subtitle:
        'セキュリティのため、現在のパスワードを新しいパスワードと一緒に入力する必要があります',
      change_password_success: 'パスワードが正常に変更されました',
      change_password_error: 'パスワードの変更に失敗しました。入力データをご確認ください',
      password_mismatch: 'パスワードが一致しません',

      // Update identity
      update_identity: '情報を更新',
      update_identity_subtitle: 'アプリの他のユーザーに表示される個人情報をここで編集できます',
      update_identity_success: '情報が正常に更新されました',
      update_identity_error: '情報の更新に失敗しました。入力データをご確認ください',

      // Avatar
      add_avatar: '画像を追加',
      change_avatar: '画像を変更',
      remove_avatar: '画像を削除',
      public_computer_hint:
        '他の人のコンピューターからログインする場合は、ブラウザのシークレットモードの使用をお勧めします。',

      // Attributes
      email: 'メールアドレス',
      first_name: '名',
      last_name: '姓',
      old_password: '現在のパスワード',
      new_password: '新しいパスワード',
      password_again: 'パスワード（確認）',
      mfa_code: 'コード',
      mfa_back: '戻る',
      mfa_resend_code: 'コードが届きませんでしたか？再送する',
      mfa_code_resent: 'コードを送信しました',
      mfa_resend_too_many_requests: '送信回数が多すぎます。しばらくしてからもう一度お試しください',
      mfa_required: '二要素認証が必要です',
      mfa_submit_code: '確認する',
      mfa_trust_device: 'このデバイスを信頼する',
      mfa_send_error: 'コードを送信できませんでした。もう一度お試しください',
      sign_in_too_many_requests:
        'ログイン試行回数が多すぎます。しばらくしてからもう一度お試しください',

      // Login
      sucessfully_logged_in: 'ログインしました',

      // Register
      register: '登録',
      do_not_have_account: 'アカウントをお持ちでない方は',
      sign_up: '登録する',
      do_have_account: 'すでにアカウントをお持ちですか？',

      // Impersonate
      impersonate_error: 'ユーザーになりすますことができません',
      impersonate_success: '%{name}としてログインしました',
      impersonate: '現在のユーザーは元のユーザー%{name}によってなりすまされています',
    },
    input: {
      ...japaneseMessages.ra.input,
      tree_array_input: {
        help: '「Ctrl」キーを押しながら値を追加できます',
      },
    },
    notification: {
      ...japaneseMessages.ra.notification,
      export_running:
        'エクスポートはバックグラウンドで実行中です。完了後にファイルをダウンロードできます',
      bad_item: '無効なアイテム',
      canceled: 'アクションがキャンセルされました',
      created: 'オブジェクトが作成されました',
      data_provider_error: 'データの読み込みエラー。詳細はブラウザのコンソールをご確認ください',
      deleted: 'オブジェクトが削除されました |||| %{smart_count}件のオブジェクトが削除されました',
      http_error: 'サーバー通信エラー',
      i18n_error: '選択した言語の翻訳を読み込めません',
      item_doesnt_exist: 'オブジェクトが存在しません',
      logged_out: 'セッションが終了しました',
      not_authorized: 'アクセス権限がありません',
      updated: 'オブジェクトが更新されました |||| %{smart_count}件のオブジェクトが更新されました',
      loading_data_error: 'データの読み込みエラー',
      upload_error: 'ファイルのアップロードエラー',
      export: 'エクスポート',
    },
    list: {
      filter_or_sort_error: 'フィルターまたは並び替えの値が無効です',
      row_click: '行をクリック: %{label}',
      row_doubleclick: '行をダブルクリック: %{label}',
    },
    filter: {
      title: '詳細フィルター',
      subtitle: '絞り込むための追加条件を選択してください',
      yes: 'はい',
      no: 'いいえ',
    },
    search: {
      search: '検索',
      not_found: '"%{search}"の検索結果はありません',
      autocomplete_not_found: 'オプションが見つかりません',
      no_connection: '接続できません',
      write_text: '入力を開始すると結果が表示されます…',
    },
    sort: {
      ...japaneseMessages.ra.sort,
      sort_by: '%{order}で並び替え',
    },
    form: {
      tab_errors: 'このタブには検証エラーがあります',
      tab_unsaved: 'このタブには未保存の変更があります',
    },
    unsaved_changes: {
      title: '未保存の変更',
      message: 'このページを離れると、未保存の変更が失われます。',
      discard: '変更を破棄',
      stay: '編集を続ける',
    },
    gallery: {
      no_photos: '写真がアップロードされていません',
    },
    ai: {
      assistant_title: 'AIアシスタント',
      empty_state: 'こんにちは！フォームの入力をお手伝いします。入力したい内容を説明してください。',
      input_placeholder: 'メッセージを入力...',
      apply_suggestion: '提案を適用',
      new_conversation: '新しい会話',
      error_message:
        '申し訳ありませんが、AIとの通信中にエラーが発生しました。もう一度お試しください。',
    },
    upload_files: {
      dialog_title: 'ファイルをアップロード',
      select_files: 'ファイルを選択',
      remove_all_tooltip: 'すべてのファイルを削除',
      remove_all: 'すべて削除',
      upload_success: 'ファイルが正常にアップロードされました。',
      upload_error: 'アップロード中にエラーが発生しました。',
      uploading: 'アップロード中…',
      processing: '処理中…',
      upload_count: 'アップロード (%{count})',
      drop_files: 'ファイルをここにドロップするかクリックして選択',
      click_to_upload: 'クリックしてアップロード',
      or_drag_and_drop: 'またはドラッグ＆ドロップ',
      upload_complete: '完了',
      upload_failed: '失敗',
      file_too_large: 'ファイルが大きすぎます。',
      file_too_large_max: 'ファイルが大きすぎます。最大: %{size}。',
      file_type_not_allowed: 'このファイル形式は許可されていません。',
      image_processing_failed: '画像を処理できませんでした。',
      unresolved_errors:
        '一部のファイルはアップロードされていません。削除するか、もう一度お試しください。',
      files_remaining_hint: '残り%{count}ファイル',
      try_again: 'もう一度試す',
    },
    settings: {
      title: '設定',
      subtitle: 'アプリの外観と動作に関する設定',
      appearance: '外観',
      color_mode: 'カラーモード',
      light: 'ライト',
      dark: 'ダーク',
      contrast_mode: 'コントラストモード',
      layout: 'レイアウト',
      page_width: 'ページ幅',
      page_width_full: 'フル',
      page_width_centered: '中央揃え',
      table: 'テーブル',
      striped_rows: '縞模様の行',
      density: '密度',
      density_compact: 'コンパクト',
      density_normal: '標準',
      density_comfortable: '快適',
      reset: 'デフォルトに戻す',
    },
    draft: {
      title: '未保存の変更が見つかりました',
      message:
        '前回のセッションからの未保存の変更があります。編集を続けますか、それとも最初からやり直しますか？',
      continue: '編集を続ける',
      discard: '破棄して最初からやり直す',
    },
    widget: {
      dashboard: {
        add: 'ウィジェットを追加',
        stop_editing: '編集を終了',
        start_editing: 'ダッシュボードを編集',
        done: '完了',
        empty:
          'ウィジェットがありません。設定アイコンをクリックして「ウィジェットを追加」を選択してください。',
        edit: '編集',
        delete: '削除',
        unknown_type: '不明なウィジェットタイプ: %{type}',
      },
      aggregate: {
        unsupported_sort: 'このフィールドはソートに対応していません',
        unsupported_resource: 'このリソースでは集計が有効になっていません',
        no_data: 'データなし',
      },
      filter_error: 'エラー：',
      definition: {
        step_resource: 'ソース',
        step_type: 'タイプ',
        step_config: '設定',
        no_types:
          '利用可能なウィジェットタイプがありません。少なくとも1つのリソースでダッシュボードを有効にしてください。',
        add: 'ウィジェットを追加',
        edit: 'ウィジェットを編集',
        back: '戻る',
        next: '次へ',
        save: '保存',
        resource_label: 'ソース',
        type_label: 'ウィジェットタイプ',
        type_table: 'テーブル',
        type_aggregate: '集計',
        color: '色',
        filters: 'フィルター',
        field: 'フィールド',
        value: '値',
        columns: '列',
        sort: '並び順',
        sort_asc: '昇順',
        sort_desc: '降順',
        per_page: '1ページの行数',
        row_actions: '行アクション',
        aggregate_function: '関数',
        fn_count: '件数',
        fn_min: '最小',
        fn_max: '最大',
        label: 'ラベル',
        label_table: 'ラベル（リストへのリンク）',
        type_simple_aggregate: 'シンプル集計',
        type_bar: '棒グラフ',
        type_pie: '円グラフ',
        type_line: '折れ線グラフ',
        fn_sum: '合計',
        fn_avg: '平均',
        group_by: 'グループ化',
        dimension: 'ディメンション',
        series: '系列',
        add_series: '系列を追加',
        remove_series: '系列を削除',
        granularity: '粒度',
        granularity_second: '秒',
        granularity_minute: '分',
        granularity_hour: '時',
        granularity_day: '日',
        granularity_week: '週',
        granularity_month: '月',
        granularity_quarter: '四半期',
        granularity_year: '年',
        bucket_size: '間隔のサイズ',
        bucket_type: '間隔の種類',
        bucket_exact: '正確な値',
        bucket_trunc: '時間バケット',
        bucket_width: '数値の幅',
        orientation: '向き',
        orientation_vertical: '垂直',
        orientation_horizontal: '水平',
        variant: 'バリアント',
        variant_pie: '円',
        variant_doughnut: 'ドーナツ',
        label_required: 'ラベルは必須です',
      },
    },
  },
};

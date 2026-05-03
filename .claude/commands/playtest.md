以下の手順でプレイテスト検証を実行してください。

1. `git diff --name-only HEAD~1` で直近の変更ファイルを確認
2. 変更がドキュメント・スタイリングのみ → 「プレイテスト不要」として終了
3. dev server 起動確認（localhost:3000）
4. Playwright MCP で以下を順に実行：
   a. Level 1：スモークテスト（LP → ゲストログイン → /play）
   b. Level 2：ゲームフローテスト（召喚・移動・攻撃・ターン終了）
   c. Level 3：勝敗判定テスト（ベース攻撃・リザルト遷移）
5. 結果をレポート形式で `docs/playtest_reports/report_YYYY-MM-DD.md` に出力
6. スクリーンショットは `docs/playtest_reports/screenshots/` に保存
7. FAIL があれば原因特定・修正を試みる
8. 修正後、失敗レベルのみ再テスト

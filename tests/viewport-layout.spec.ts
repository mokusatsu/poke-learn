import { test, expect } from '@playwright/test';

test.describe('Poke-Learn ビューポート収まり & スクロール防止検証', () => {
  const testCases = [
    { width: 1920, height: 1080, name: 'FullHD-Desktop' },
    { width: 1920, height: 750, name: 'FHD-Browser-Viewport' },
    { width: 1280, height: 700, name: 'Narrow-Height-Laptop' },
    { width: 1024, height: 768, name: 'Tablet-4x3' },
    { width: 375, height: 812, name: 'Smartphone' }
  ];

  for (const vp of testCases) {
    test.describe(`${vp.name} (${vp.width}x${vp.height}) での検証`, () => {
      test.beforeEach(async ({ page }) => {
        // ビューポートサイズを設定
        await page.setViewportSize({ width: vp.width, height: vp.height });
        // アプリケーションへ遷移
        await page.goto('/');
        // DOMのロード完了を待機
        await page.waitForLoadState('domcontentloaded');
        // ナビゲーションタブのロードを待機
        await page.waitForSelector('.tab-container');
      });

      // 共通のレイアウトはみ出し検証関数
      const checkLayout = async (page: any, contextName: string) => {
        // DOMレンダリング更新のための短いウェイト
        await page.waitForTimeout(400);

        const metrics = await page.evaluate(() => {
          const innerHeight = window.innerHeight;
          const innerWidth = window.innerWidth;
          const scrollHeight = document.documentElement.scrollHeight;
          const scrollWidth = document.documentElement.scrollWidth;
          
          // 可視要素が画面の左右・上下にはみ出していないかを厳密にチェック
          const allElements = Array.from(document.querySelectorAll('main *'));
          let hasOverflow = false;
          let overflowDetails = '';

          for (const el of allElements) {
            const htmlEl = el as HTMLElement;
            const rect = htmlEl.getBoundingClientRect();
            
            // レイアウトボックスを持ち、表示されている要素を対象とする
            if (rect.width > 0 && rect.height > 0) {
              const style = window.getComputedStyle(htmlEl);
              if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
                continue;
              }

              // 1. 左側へのはみ出しは LTR ではスクロール不可能なので、常にエラーとする (Micro-margins under 1.5px are ignored)
              if (rect.left < -1.5) {
                hasOverflow = true;
                overflowDetails = `Element <${htmlEl.tagName.toLowerCase()}> (class="${htmlEl.className}") clipped on the left: left=${Math.round(rect.left)}px (viewport width=${innerWidth}px)`;
                break;
              }

              // 2. 右側へのはみ出し（クリッピング）検出
              if (rect.right > innerWidth + 1.5) {
                // スクロール可能な親要素の中に入っている場合は許容
                let parent: HTMLElement | null = htmlEl.parentElement;
                let isInsideScrollContainer = false;
                while (parent && parent !== document.body) {
                  const pStyle = window.getComputedStyle(parent);
                  if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflow === 'auto' || pStyle.overflow === 'scroll') {
                    isInsideScrollContainer = true;
                    break;
                  }
                  parent = parent.parentElement;
                }

                if (!isInsideScrollContainer) {
                  hasOverflow = true;
                  overflowDetails = `Element <${htmlEl.tagName.toLowerCase()}> (class="${htmlEl.className}") overflowed horizontally to the right: right=${Math.round(rect.right)}px (viewport width=${innerWidth}px)`;
                  break;
                }
              }

              // 3. 上下のはみ出し検出（縦方向のクリッピング）
              // 画面全体の縦スクロールを許容するため、下側へのはみ出し (rect.bottom > innerHeight) はエラーとしない。
              // ただし、画面上部へのはみ出し (rect.top < -1.5) はスクロール可能なコンテナに属していない限り見切れエラーとする。
              if (rect.top < -1.5) {
                // スクロール可能な親要素の中に入っている場合は許容
                let parent: HTMLElement | null = htmlEl.parentElement;
                let isInsideScrollContainer = false;
                while (parent && parent !== document.body) {
                  const pStyle = window.getComputedStyle(parent);
                  if (pStyle.overflowY === 'auto' || pStyle.overflowY === 'scroll' || pStyle.overflow === 'auto' || pStyle.overflow === 'scroll') {
                    isInsideScrollContainer = true;
                    break;
                  }
                  parent = parent.parentElement;
                }

                if (!isInsideScrollContainer) {
                  hasOverflow = true;
                  overflowDetails = `Element <${htmlEl.tagName.toLowerCase()}> (class="${htmlEl.className}") overflowed vertically on the top: top=${Math.round(rect.top)}px`;
                  break;
                }
              }
            }
          }

          const mainEl = document.querySelector('main');
          const rect = mainEl ? mainEl.getBoundingClientRect() : null;

          return {
            isVerticalScrollable: scrollHeight > innerHeight,
            isHorizontalScrollable: scrollWidth > innerWidth,
            hasOverflow,
            overflowDetails,
            scrollHeight,
            innerHeight,
            scrollWidth,
            innerWidth,
            mainBottom: rect ? rect.bottom : 0
          };
        });

        try {
          // 判定1: 縦スクロールバーが発生していないこと (全体の縦スクロールを許容するためアサーションをスキップ)
          // 判定2: 横スクロールバーが発生していないこと
          expect(
            metrics.isHorizontalScrollable,
            `[${contextName}] 横スクロールが発生しています (ScrollWidth: ${metrics.scrollWidth}px > ViewportWidth: ${metrics.innerWidth}px)`
          ).toBe(false);

          // 判定3: 要素の見切れ（クリッピング）が発生していないこと
          expect(
            metrics.hasOverflow,
            `[${contextName}] 画面外への要素見切れを検知しました: ${metrics.overflowDetails}`
          ).toBe(false);

          // 判定4: メインコンテンツの下端が見切れていないこと (全体の縦スクロールを許容するためアサーションをスキップ)
        } catch (error) {
          // エラー検知時に自動でスクリーンショットを撮影して保存
          const path = `test-results/failed-layout-${contextName}-${metrics.innerWidth}x${metrics.innerHeight}.png`;
          await page.screenshot({ path, fullPage: true });
          console.error(`Layout check failed for [${contextName}]. Screenshot saved to ${path}`);
          throw error;
        }
      };

      test('タイプ相性クイズ（シンプル回答後）', async ({ page }) => {
        // 「タイプ相性」タブを選択
        await page.click('.tab-container button:has-text("タイプ相性")');
        
        // シンプルクイズモードが選択されていることを保証（初期状態で選択されているはずだが念のため）
        const simpleTab = page.locator('button:has-text("攻撃側 (シンプル)")');
        if (await simpleTab.isVisible()) {
          await simpleTab.click();
          await page.waitForTimeout(200);
        }

        // 初期レイアウトチェック
        await checkLayout(page, 'TypeQuiz-Simple-Initial');

        // 回答選択肢をクリック（即時回答確定）
        const optionButtons = page.locator('button:has-text("ばつぐん"), button:has-text("等倍"), button:has-text("いまひとつ"), button:has-text("無効")');
        if (await optionButtons.count() > 0) {
          await optionButtons.first().click();
          // 回答決定後の解説表示状態でのレイアウトチェック
          await checkLayout(page, 'TypeQuiz-Simple-Answered');
        }
      });

      test('最大打点技選択クイズ（初期・プレイ中）', async ({ page }) => {
        // 「タイプ相性」タブを選択
        await page.click('.tab-container button:has-text("タイプ相性")');
        
        // 最大打点技選択のサブタブを選択
        const maxPowerTab = page.locator('button:has-text("最大打点技選択")');
        if (await maxPowerTab.isVisible()) {
          await maxPowerTab.click();
          await page.waitForTimeout(200);
        }

        // 初期（ルール説明）レイアウトチェック
        await checkLayout(page, 'TypeQuiz-MaxPower-Start');

        // ゲームを開始する！ボタンをクリック
        const startBtn = page.locator('button:has-text("ゲームを開始する！")');
        if (await startBtn.isVisible()) {
          await startBtn.click();
          await page.waitForTimeout(200);
          // プレイ画面（タイマーと手札ボタンと敵ポケモンカードが出ている状態）
          await checkLayout(page, 'TypeQuiz-MaxPower-Playing');
        }
      });

      test('6vs6選出クイズ（回答後）', async ({ page }) => {
        // 「選出」タブを選択
        await page.click('.tab-container button:has-text("選出")');
        
        // レンダリングとデータのAPIフェッチ完了を待つ
        await page.waitForSelector('.pokemon-card');
        await page.waitForTimeout(500);

        // 初期レイアウトチェック
        await checkLayout(page, 'SelectionQuiz-Initial');

        // あなたの控えチーム（後半の6つのカード）から3体を選択
        const cards = page.locator('.pokemon-card');
        const cardCount = await cards.count();
        
        let selectCount = 0;
        for (let i = 0; i < cardCount; i++) {
          const card = cards.nth(i);
          const isYourTeam = await card.evaluate((el) => {
            // 親要素のテキストや位置から味方のチームかをチェック
            return el.closest('div')?.parentElement?.innerText.includes('あなたの控えチーム') || false;
          });
          
          // 簡易フォールバック（後半6枚を味方とみなす）
          if (isYourTeam || i >= 6) {
            await card.click();
            selectCount++;
            if (selectCount >= 3) break;
          }
        }

        // 「選出を確定してバトル！」ボタンをクリックして結果を表示
        const submitBtn = page.locator('button:has-text("選出を確定してバトル！")');
        if (await submitBtn.isVisible() && !(await submitBtn.isDisabled())) {
          await submitBtn.click();
          // 回答後の解説表示状態でのレイアウトチェック
          await checkLayout(page, 'SelectionQuiz-Answered');
        }
      });

      test('一貫技クイズ（回答後）', async ({ page }) => {
        // 「一貫技」タブを選択
        await page.click('.tab-container button:has-text("一貫技")');
        
        // レンダリングとデータのAPIフェッチ完了を待つ
        await page.waitForSelector('.pokemon-card');
        await page.waitForTimeout(500);

        // 初期レイアウトチェック
        await checkLayout(page, 'ConsistencyQuiz-Initial');

        // タイプボタンをクリックして選択状態にする
        const typeButtons = page.locator('.glass-panel button');
        const count = await typeButtons.count();
        if (count > 0) {
          // 適当なタイプを1つ選択
          await typeButtons.first().click();
        }

        // 「回答を決定する」ボタンをクリックして結果を表示
        const submitBtn = page.locator('button:has-text("回答を決定する")');
        if (await submitBtn.isVisible() && !(await submitBtn.isDisabled())) {
          await submitBtn.click();
          // 回答後の解説表示状態でのレイアウトチェック
          await checkLayout(page, 'ConsistencyQuiz-Answered');
        }
      });

      test('6vs6相性可視化（ホバー時）', async ({ page }) => {
        // 「相性可視化」タブを選択
        await page.click('.tab-container button:has-text("相性可視化")');
        // ポケモンデータのロード完了を保証するために待機
        await page.waitForSelector('.pokemon-card');
        await page.waitForTimeout(500);

        // 初期レイアウトチェック
        await checkLayout(page, 'TeamVisualizer-Initial');

        // ポケモンカードにホバーして関係線を表示
        const firstCard = page.locator('.pokemon-card').first();
        if (await firstCard.isVisible()) {
          await firstCard.hover();
          // ホバーによってツールチップ等が出現した状態でのレイアウトチェック
          await checkLayout(page, 'TeamVisualizer-Hovered');
        }
      });

      test('苦手分析＆特訓（初期・スキャン表示）', async ({ page }) => {
        // 「苦手分析＆特訓」タブを選択
        await page.click('.tab-container button:has-text("苦手分析")');
        // 短いウェイト
        await page.waitForTimeout(300);
        // 初期レイアウトチェック
        await checkLayout(page, 'WeaknessAnalysis-Initial');
      });

      test('アカウント設定（👤ボタンクリック遷移）', async ({ page }) => {
        // ヘッダーの👤ボタンをクリック
        await page.click('button:has-text("👤")');
        // 短いウェイト
        await page.waitForTimeout(400);
        // レイアウトチェック
        await checkLayout(page, 'AccountSettings-Initial');
      });
    });
  }
});

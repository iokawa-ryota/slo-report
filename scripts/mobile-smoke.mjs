import { chromium } from 'playwright';

const baseUrl = process.env.TARGET_URL || 'http://127.0.0.1:4173';

async function expectVisible(locator, message) {
  if (!(await locator.isVisible())) {
    throw new Error(message);
  }
}

async function expectNoHorizontalOverflow(page, selector, message) {
  const hasOverflow = await page.locator(selector).evaluate((element) => (
    element.scrollWidth - element.clientWidth > 1
  ));

  if (hasOverflow) {
    throw new Error(message);
  }
}

async function addRecord(page, record) {
  await page.locator('header button').nth(1).click();
  await expectVisible(page.locator('form'), '入力フォームが開きませんでした');
  await expectNoHorizontalOverflow(page, 'form', '新規入力フォームのモバイル表示で横スクロールが発生しています');

  await page.locator('select[name="machineName"]').selectOption(record.machineName);
  await page.locator('input[name="date"]').fill(record.date);
  await page.locator('input[name="totalGames"]').fill(record.totalGames);
  await page.locator('input[name="bigCount"]').fill(record.bigCount);
  await page.locator('input[name="regCount"]').fill(record.regCount);
  await page.locator('input[name="investment"]').fill(record.investment);
  await page.locator('input[name="recovery"]').fill(record.recovery);
  await page.locator('textarea[name="memo"]').fill(record.memo);
  await page.getByRole('button', { name: '記録を保存する' }).click();
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo'
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const menuButton = page.locator('header button').first();
    await expectVisible(menuButton, 'モバイル用メニューボタンが表示されていません');
    await menuButton.click();
    await expectVisible(page.getByRole('button', { name: '全履歴一覧' }), 'サイドメニューが開きませんでした');
    await page.getByRole('button', { name: '新ハナビ' }).click();
    await expectVisible(page.getByText('機種統計: 新ハナビ'), 'モバイルメニューから機種画面へ遷移できませんでした');

    await menuButton.click();
    await expectVisible(page.getByRole('button', { name: '総合ダッシュボード' }), 'サイドメニューを再度開けませんでした');
    await page.getByRole('button', { name: '総合ダッシュボード' }).click();
    await expectNoHorizontalOverflow(page, 'body', '初期表示のモバイル画面で横スクロールが発生しています');
    await addRecord(page, {
      machineName: 'テスト',
      date: '2026-03-10',
      totalGames: '1500',
      bigCount: '6',
      regCount: '5',
      investment: '1200',
      recovery: '1400',
      memo: 'test-machine-mobile'
    });

    await menuButton.click();
    await page.getByRole('button', { name: '全履歴一覧' }).click();
    await expectVisible(page.getByRole('heading', { name: '全履歴' }), '全履歴画面へ遷移できませんでした');
    await expectVisible(page.getByText('2026-03-10'), '保存後の履歴に最新レコードが表示されていません');

    await page.locator('input[type="date"]').nth(0).fill('2026-03-05');
    await page.waitForTimeout(300);
    await page.getByLabel('履歴を編集: 2026-03-10 テスト').first().click();
    await expectVisible(page.getByRole('heading', { name: '実践記録を編集' }), '編集モーダルが開きませんでした');
    await expectNoHorizontalOverflow(page, 'form', '編集フォームのモバイル表示で横スクロールが発生しています');

    const editMachine = await page.locator('select[name="machineName"]').inputValue();
    const editMemo = await page.locator('textarea[name="memo"]').inputValue();
    if (editMachine !== 'テスト' || editMemo !== 'test-machine-mobile') {
      throw new Error(`フィルター後の編集対象が不正です: machine=${editMachine}, memo=${editMemo}`);
    }
    await page.getByRole('button', { name: 'フォームを閉じる' }).click();

    const storedRecords = await page.evaluate(() => JSON.parse(localStorage.getItem('pachislo-records-v9') || '[]'));
    const savedTestRecord = storedRecords.find((record) => record.machineName === 'テスト' && record.memo === 'test-machine-mobile');
    if (!savedTestRecord) {
      throw new Error('localStorage にテスト機種の保存データが見つかりませんでした');
    }

    await menuButton.click();
    await page.getByRole('button', { name: '設定推測' }).click();
    await expectVisible(page.getByText('うみねこのなく頃に2'), '設定推測画面へ遷移できませんでした');
    await expectNoHorizontalOverflow(page, 'body', '設定推測画面の320px表示で横スクロールが発生しています');

    await page.getByRole('textbox', { name: '総ゲーム数' }).fill('3200');
    await page.getByRole('textbox', { name: 'BIG回数' }).fill('10');
    await page.getByRole('textbox', { name: 'REG回数' }).fill('11');
    await page.getByRole('textbox', { name: 'ARTゲーム数' }).fill('600');
    await page.getByRole('textbox', { name: 'ART中共通ベル回数' }).fill('28');
    await page.getByRole('textbox', { name: 'ART中ハズレ回数' }).fill('10');

    const inferenceDraft = await page.evaluate(() => JSON.parse(localStorage.getItem('setting-inference-draft-v1:umineko2') || '{}'));
    if (inferenceDraft.input?.totalGames !== '3200' || inferenceDraft.input?.artGames !== '600') {
      throw new Error('設定推測ドラフトがlocalStorageへ保存されていません');
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('header button').first().click();
    await page.getByRole('button', { name: '設定推測' }).click();

    const restoredTotalGames = await page.getByRole('textbox', { name: '総ゲーム数' }).inputValue();
    const restoredArtGames = await page.getByRole('textbox', { name: 'ARTゲーム数' }).inputValue();
    if (restoredTotalGames !== '3200' || restoredArtGames !== '600') {
      throw new Error(`設定推測ドラフトが復元されていません: total=${restoredTotalGames}, art=${restoredArtGames}`);
    }

    await expectVisible(page.getByText('最有力設定'), '設定推測結果が表示されていません');

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      device: '320px mobile',
      savedRecords: storedRecords.length,
      latestRecord: storedRecords[0]?.memo || null,
      savedMachineName: savedTestRecord.machineName,
      restoredInferenceDraft: restoredTotalGames
    }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    baseUrl,
    error: error.message
  }, null, 2));
  process.exit(1);
});

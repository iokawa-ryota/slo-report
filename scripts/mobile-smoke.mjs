import { chromium, devices } from 'playwright';

const baseUrl = process.env.TARGET_URL || 'http://127.0.0.1:4173';
const iPhone = devices['iPhone 12'];

async function expectVisible(locator, message) {
  if (!(await locator.isVisible())) {
    throw new Error(message);
  }
}

async function addRecord(page, record) {
  await page.locator('header button').nth(1).click();
  await expectVisible(page.locator('form'), '入力フォームが開きませんでした');

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
    ...iPhone,
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

    const recentHistory = page.locator('#recent-history-section');
    await expectVisible(recentHistory, '直近履歴セクションが表示されていません');

    const historyText = await recentHistory.innerText();
    if (!historyText.includes('2026-03-10 - テスト')) {
      throw new Error('保存後の履歴にテスト機種の最新レコードが反映されていません');
    }

    await page.locator('input[type="date"]').nth(0).fill('2026-03-05');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: '編集' }).first().click();
    await expectVisible(page.getByRole('heading', { name: '実践記録を編集' }), '編集モーダルが開きませんでした');

    const editMachine = await page.locator('select[name="machineName"]').inputValue();
    const editMemo = await page.locator('textarea[name="memo"]').inputValue();
    if (editMachine !== 'テスト' || editMemo !== 'test-machine-mobile') {
      throw new Error(`フィルター後の編集対象が不正です: machine=${editMachine}, memo=${editMemo}`);
    }

    const storedRecords = await page.evaluate(() => JSON.parse(localStorage.getItem('pachislo-records-v9') || '[]'));
    const savedTestRecord = storedRecords.find((record) => record.machineName === 'テスト' && record.memo === 'test-machine-mobile');
    if (!savedTestRecord) {
      throw new Error('localStorage にテスト機種の保存データが見つかりませんでした');
    }

    console.log(JSON.stringify({
      ok: true,
      baseUrl,
      device: 'iPhone 12',
      savedRecords: storedRecords.length,
      latestRecord: storedRecords[0]?.memo || null,
      savedMachineName: savedTestRecord.machineName
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

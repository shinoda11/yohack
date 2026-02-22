'use client';

import { useRef, useState } from 'react';
import { useProfileStore } from '@/lib/store';
import { validateProfile } from '@/lib/engine';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Upload,
  Trash2,
  Settings,
  Info,
  ExternalLink,
} from 'lucide-react';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const { profile, scenarios, resetProfile } = useProfileStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  // === エクスポート ===
  const handleExport = () => {
    const data = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      scenarios,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yohack-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'エクスポート完了', description: 'バックアップファイルをダウンロードしました' });
  };

  // === インポート ===
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error('ファイルの読み込みに失敗しました');
        }

        const data = JSON.parse(text);

        // バリデーション: profile が存在するか
        if (!data.profile) {
          throw new Error('プロファイルデータが含まれていません');
        }

        // バリデーション: validateProfile でチェック
        const errors = validateProfile(data.profile);
        if (errors.length > 0) {
          const messages = errors.slice(0, 3).map(e => e.message).join('、');
          throw new Error(`不正なプロファイルデータ: ${messages}`);
        }

        // プロファイルを復元
        useProfileStore.setState({
          profile: data.profile,
          scenarios: Array.isArray(data.scenarios) ? data.scenarios : [],
          activeScenarioId: null,
          comparisonIds: [],
        });

        // シミュレーションを再実行
        useProfileStore.getState().runSimulationAsync();

        toast({ title: 'インポート完了', description: 'データを復元しました' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました';
        toast({ title: 'インポート失敗', description: message, variant: 'destructive' });
      }
    };
    reader.readAsText(file);

    // 同じファイルを再選択可能にする
    e.target.value = '';
  };

  // === リセット ===
  const handleReset = () => {
    // localStorage を全クリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('exit-readiness-profile');
      localStorage.removeItem('exit-readiness-scenarios');
      localStorage.removeItem('yohack-onboarding-complete');
      localStorage.removeItem('yohack-profile-completeness-dismissed');
    }

    // ストアをリセット
    resetProfile();
    useProfileStore.setState({
      scenarios: [],
      activeScenarioId: null,
      comparisonIds: [],
    });

    setIsResetDialogOpen(false);
    toast({ title: 'リセット完了', description: 'すべてのデータを初期状態に戻しました' });
  };

  return (
    <>
      <div className="container mx-auto max-w-3xl px-4 py-4 md:p-6 space-y-6 overflow-x-hidden">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">設定</h1>
            <p className="text-sm text-brand-bronze mt-1">
              データ管理とアプリケーション情報
            </p>
          </div>

          {/* 1. データ管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                データ管理
              </CardTitle>
              <CardDescription>
                プロファイルとシナリオのバックアップ・復元・リセット
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Button variant="outline" className="justify-start gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  データをエクスポート
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={handleImport}>
                  <Upload className="h-4 w-4" />
                  データをインポート
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                プロファイルと保存済みシナリオを含むJSONファイルが出力されます
              </p>

              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  className="justify-start gap-2"
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  すべてのデータをリセット
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  すべてのデータが初期状態に戻ります。元に戻せません
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. シミュレーション設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                シミュレーション設定
              </CardTitle>
              <CardDescription>
                モンテカルロシミュレーションのパラメータ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">シミュレーション回数</div>
                  <div className="text-lg font-bold">1,000回</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-sm text-muted-foreground">最大年齢</div>
                  <div className="text-lg font-bold">100歳</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                現在は固定値です
              </p>
            </CardContent>
          </Card>

          {/* 3. アプリ情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                アプリ情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">バージョン</span>
                  <span className="text-sm font-normal">v{APP_VERSION}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">アプリ名</span>
                  <span className="text-sm font-normal">YOHACK</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm font-normal">YOHACK - 人生に、余白を。</p>
                <p className="text-xs text-muted-foreground mt-1">
                  お金・時間・体力の余白で人生の選択を比較するシミュレーター
                </p>
              </div>
              <a
                href="https://github.com/shinoda11/v0-exit-readiness-os"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                GitHub リポジトリ
              </a>
            </CardContent>
          </Card>
      </div>

      {/* リセット確認ダイアログ */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>すべてのデータをリセット</DialogTitle>
            <DialogDescription>
              すべてのデータが削除されます。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              リセットする
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

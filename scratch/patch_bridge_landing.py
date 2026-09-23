file_path = "packages/plugin/src/ui/components/AgentBridgeView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """            updateLogRef.current(logId, "success", `Square carousel component ready (${carouselResult.slideCount || 4} slides)!`);
            ws.send(JSON.stringify({ id, success: true, data: carouselResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }"""

landing_code = """

        if (type === "CREATE_PRODUCT_LANDING_PAGE") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Product Story", "pending", "Creating 8-chapter interactive product landing page in Figma...");

          try {
            const storyResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_CREATE_PRODUCT_LANDING_PAGE", payload: { requestId: id, ...payload } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out generating product landing page" });
                }
              }, 60000);
            });

            if (!storyResult || !storyResult.success) {
              throw new Error(storyResult?.error || "Failed to create product landing page");
            }

            updateLogRef.current(logId, "success", `8-Chapter product landing page created (${storyResult.framesCount || 8} frames wired with Smart Animate)!`);
            ws.send(JSON.stringify({ id, success: true, data: storyResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }"""

if target in text:
    text = text.replace(target, target + landing_code, 1)
    print("LANDING CODE ADDED")
else:
    print("TARGET NOT FOUND")

with open(file_path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("FILE SAVED")

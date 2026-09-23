file_path = "packages/plugin/src/ui/components/AgentBridgeView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

target1 = """        msg.type === "ADD_PROTOTYPE_EFFECTS_RESULT" ||
        msg.type === "CREATE_CAROUSEL_COMPONENT_RESULT"
      ) {"""

replacement1 = """        msg.type === "ADD_PROTOTYPE_EFFECTS_RESULT" ||
        msg.type === "CREATE_CAROUSEL_COMPONENT_RESULT" ||
        msg.type === "PRODUCT_LANDING_PAGE_CREATED"
      ) {"""

if target1 in text:
    text = text.replace(target1, replacement1, 1)
    print("LISTENER ADDED")
else:
    print("TARGET 1 NOT FOUND")

target2 = """        if (type === "CREATE_CAROUSEL_COMPONENT") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Carousel", "pending", "Creating product carousel component set in Figma...");

          try {
            const carouselResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_CREATE_CAROUSEL_COMPONENT", payload: { requestId: id, ...payload } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out creating carousel component" });
                }
              }, 40000);
            });

            if (!carouselResult || !carouselResult.success) {
              throw new Error(carouselResult?.error || "Failed to create carousel component");
            }

            updateLogRef.current(logId, "success", `Product carousel component set created: ${carouselResult.slideCount || 4} slides with smooth animations!`);
            ws.send(JSON.stringify({ id, success: true, data: carouselResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }"""

landing_block = """

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

if target2 in text:
    text = text.replace(target2, target2 + landing_block, 1)
    print("COMMAND HANDLER ADDED")
else:
    print("TARGET 2 NOT FOUND")

with open(file_path, "w", encoding="utf-8", newline="") as f:
    f.write(text)

print("AGENT BRIDGE VIEW UPDATED")

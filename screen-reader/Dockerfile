# Guidepup's image has the screen reader (Orca) but no browser; this adds the system libraries Firefox needs.
# (Guidepup tests Orca with Firefox only: its own example and CI use no other browser on Linux.)
FROM ghcr.io/guidepup/guidepup:0.40.0-ubuntu-resolute-node24
RUN npx --yes playwright@1.65.0 install-deps firefox
